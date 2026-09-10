import hashlib
import hmac
import json
import logging
import os
import sqlite3
import time
from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path
from typing import Annotated
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError
from .database import connect, dataset, initialize, now, save_record
from .models import Claim, Entity, Review, Source
from .semantics import comparison, graph, scenario

log = logging.getLogger("supply-atlas")

@asynccontextmanager
async def lifespan(app):
    initialize()
    yield

app = FastAPI(title="Supply Atlas API", version="0.1.0", lifespan=lifespan)

@app.middleware("http")
async def security(request: Request, call_next):
    started = time.monotonic()
    if request.method in ("POST", "PUT", "PATCH"):
        # Bound both declared and streamed bodies before JSON parsing.
        size = 0
        body = bytearray()
        async for chunk in request.stream():
            size += len(chunk)
            if size > 2_000_000:
                return JSONResponse({"detail": "Request exceeds 2 MB"}, status_code=413)
            body.extend(chunk)
        request._body = bytes(body)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://tile.openstreetmap.org; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    if request.url.path.startswith("/api/admin"):
        response.headers["Cache-Control"] = "no-store"
    log.info("%s %s %s %.3fs", request.method, request.url.path, response.status_code, time.monotonic()-started)
    return response

@app.exception_handler(sqlite3.OperationalError)
async def db_error(request, exc):
    log.exception("Database operation failed")
    return JSONResponse({"detail": "Database unavailable; retry shortly or check server storage."}, status_code=503)

def admin(request: Request, authorization: Annotated[str | None, Header()] = None):
    secret = os.environ.get("ADMIN_TOKEN", "")
    if len(secret) < 32:
        raise HTTPException(503, "Administration is disabled. Configure an ADMIN_TOKEN of at least 32 characters on the server.")
    # No cookies: credentials are explicit, memory-only bearer headers. CSRF has no ambient authority.
    client = hashlib.sha256((request.client.host if request.client else "unknown").encode()).hexdigest()
    with connect() as db:
        row = db.execute("SELECT * FROM login_attempts WHERE client=?", (client,)).fetchone()
        if row and time.time()-row["window_start"] < 900 and row["attempts"] >= 10:
            raise HTTPException(429, "Too many failed attempts. Try again in 15 minutes.")
        if not authorization or not hmac.compare_digest(authorization.encode(), ("Bearer " + secret).encode()):
            db.execute("DELETE FROM login_attempts WHERE window_start<?", (time.time()-900,))
            db.execute("INSERT INTO login_attempts VALUES (?,1,?) ON CONFLICT(client) DO UPDATE SET attempts=attempts+1", (client,time.time()))
            db.commit()
            raise HTTPException(401, "Invalid administrator token")
        db.execute("DELETE FROM login_attempts WHERE client=?", (client,))

def filters(status: str = "all", role: str = "all", at: date | None = None, variant: str | None = None, supplier: str | None = None, part: str | None = None):
    if status not in ("all", "direct", "inferred", "disputed", "outdated"):
        raise HTTPException(422, "Invalid evidence status")
    if role not in ("all", "designer", "fabricator", "packager", "assembler", "distributor", "material supplier", "component supplier"):
        raise HTTPException(422, "Invalid manufacturing role")
    return dict(status=status, role=role, at=at.isoformat() if at else None, variant=variant, supplier=supplier, part=part)

def get_data():
    with connect() as db:
        return dataset(db)

def require_entity(data, id, kinds=None):
    entity = next((e for e in data["entities"] if e["id"] == id), None)
    if not entity or (kinds and entity["kind"] not in kinds):
        raise HTTPException(404, "Entity not found")
    return entity

@app.get("/api/health")
def health():
    with connect() as db:
        db.execute("SELECT 1 FROM schema_migrations LIMIT 1").fetchone()
    return {"status": "ok", "storage": "sqlite"}

@app.get("/api/atlas")
def atlas():
    data = get_data()
    data["coverage"] = "Documented partial collection. Unknown relationships are not evidence of no relationship. Source dates describe observations, not assured current sourcing."
    return data

@app.get("/api/entities")
def entities(q: str = Query("", max_length=200), kind: str | None = None):
    return [e for e in get_data()["entities"] if (not kind or e["kind"] == kind) and q.casefold() in " ".join([e["name"],e["description"],*e["aliases"]]).casefold()]

@app.get("/api/entities/{id}")
def profile(id: str):
    data = get_data()
    return {"entity": require_entity(data,id), "claims": [c for c in data["claims"] if id in [c.get(k) for k in ("supplier_id", "customer_id", "product_id", "part_id", "facility_id", "material_id", "region_id")]]}

@app.get("/api/graph/{product}")
def network(product: str, depth: int = Query(2, ge=1, le=3), f: dict = Depends(filters)):
    data = get_data()
    require_entity(data,product,["product"])
    return graph(data,product,depth,**f)

@app.get("/api/scenario/{target}")
def disruption(target: str, f: dict = Depends(filters)):
    data = get_data()
    require_entity(data,target)
    return scenario(data,target,**f)

@app.get("/api/compare")
def compare(left: str, right: str, f: dict = Depends(filters)):
    data = get_data()
    require_entity(data,left,["product","company"])
    require_entity(data,right,["product","company"])
    return comparison(data,left,right,**f)

@app.get("/api/admin/status", dependencies=[Depends(admin)])
def admin_status():
    with connect() as db:
        return {"runs": [dict(r) for r in db.execute("SELECT * FROM ingestion_runs ORDER BY id DESC LIMIT 100")], "revisions": [dict(r) for r in db.execute("SELECT id,kind,record_id,reason,created_at FROM revisions ORDER BY id DESC LIMIT 100")], "sources": [dict(r) for r in db.execute("SELECT * FROM source_cache")], "review_queue": [json.loads(r[0]) for r in db.execute("SELECT payload FROM claims WHERE status!='direct'")]}

@app.put("/api/admin/{kind}/{id}", dependencies=[Depends(admin)])
def review(kind: str, id: str, body: Review):
    model = {"entity": Entity, "claim": Claim, "source": Source}.get(kind)
    if not model:
        raise HTTPException(404,"Unknown record type")
    try:
        record = model.model_validate(body.record)
        if record.id != id:
            raise ValueError("Record ID cannot change; create an alias for entity resolution")
        with connect() as db:
            if kind == "entity":
                previous = db.execute("SELECT kind FROM entities WHERE id=?", (id,)).fetchone()
                if previous and previous[0] != record.kind:
                    raise ValueError("An existing entity cannot change type")
            save_record(db,kind,record,body.reason)
        return {"status": "saved"}
    except (ValueError, ValidationError, sqlite3.IntegrityError) as exc:
        raise HTTPException(422, str(exc)) from exc

DIST = Path(__file__).resolve().parent.parent / "dist"
if DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")
    @app.get("/{path:path}")
    def frontend(path: str):
        if path.startswith("api/"):
            raise HTTPException(404, "API route not found")
        return FileResponse(DIST / "index.html")
