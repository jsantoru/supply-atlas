import hashlib
import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from .models import Bundle, Claim, Entity, Source

ROOT = Path(__file__).resolve().parent

def now():
    return datetime.now(timezone.utc).isoformat()

def db_path():
    return Path(os.environ.get("DATABASE_PATH", str(ROOT.parent / "data" / "atlas.sqlite3")))

@contextmanager
def connect():
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=15)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    db.execute("PRAGMA busy_timeout=15000")
    try:
        with db:
            yield db
    finally:
        db.close()

def migrate():
    with connect() as db:
        db.execute("PRAGMA journal_mode=WAL")
        db.execute("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)")
        for path in sorted((ROOT / "migrations").glob("*.sql")):
            if not db.execute("SELECT 1 FROM schema_migrations WHERE name=?", (path.name,)).fetchone():
                # Transactionally apply DDL and the version marker together.
                sql = path.read_text(encoding="utf-8")
                db.executescript("BEGIN IMMEDIATE;\n" + sql + "\nINSERT INTO schema_migrations VALUES ('" + path.name + "',datetime('now'));\nCOMMIT;")

def dataset(db):
    return {table: [json.loads(r[0]) for r in db.execute(f"SELECT payload FROM {table} ORDER BY rowid")] for table in ("entities", "sources", "claims")}

def validate_links(db, record):
    expected = {"supplier_id": "company", "customer_id": "company", "product_id": "product", "part_id": "part", "facility_id": "facility", "material_id": "material", "variant_id": "variant", "region_id": "region", "industry_id": "industry", "category_id": "category"}
    for key, kind in expected.items():
        value = getattr(record, key, None)
        if value:
            row = db.execute("SELECT kind FROM entities WHERE id=?", (value,)).fetchone()
            if not row or row[0] != kind:
                raise ValueError(f"{key} must reference an existing {kind}")
    if isinstance(record, Claim):
        for evidence in record.evidence:
            if not db.execute("SELECT 1 FROM sources WHERE id=?", (evidence.source_id,)).fetchone():
                raise ValueError("Evidence source does not exist")
        if record.variant_id:
            variant = json.loads(db.execute("SELECT payload FROM entities WHERE id=?", (record.variant_id,)).fetchone()[0])
            if variant.get("parent_id") != record.product_id:
                raise ValueError("Variant must belong to the claim product")
        if record.supersedes and not db.execute("SELECT 1 FROM claims WHERE id=?", (record.supersedes,)).fetchone():
            raise ValueError("Superseded claim does not exist")

def save_record(db, kind, record, reason, validate=True):
    table = {"entity": "entities", "source": "sources", "claim": "claims"}[kind]
    if validate:
        validate_links(db, record)
    payload = record.model_dump_json()
    old = db.execute(f"SELECT payload FROM {table} WHERE id=?", (record.id,)).fetchone()
    if old and old[0] == payload:
        return False
    if kind == "entity":
        db.execute("INSERT INTO entities VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,name=excluded.name,payload=excluded.payload", (record.id, record.kind, record.name, payload))
    elif kind == "source":
        db.execute("INSERT INTO sources VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload", (record.id, payload))
    else:
        fields = [getattr(record, k) for k in ("id", "supplier_id", "customer_id", "product_id", "part_id", "facility_id", "material_id", "status")]
        db.execute("INSERT INTO claims VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET supplier_id=excluded.supplier_id,customer_id=excluded.customer_id,product_id=excluded.product_id,part_id=excluded.part_id,facility_id=excluded.facility_id,material_id=excluded.material_id,status=excluded.status,payload=excluded.payload", (*fields, payload))
        db.execute("DELETE FROM evidence WHERE claim_id=?", (record.id,))
        db.executemany("INSERT OR IGNORE INTO evidence VALUES (?,?,?)", [(record.id, e.source_id, e.reference) for e in record.evidence])
    db.execute("INSERT INTO revisions(kind,record_id,before_json,after_json,reason,created_at) VALUES (?,?,?,?,?,?)", (kind, record.id, old[0] if old else None, payload, reason, now()))
    return True

def ingest_bundle(raw, reason="Initial human-reviewed research collection", only_if_empty=False):
    bundle = Bundle.model_validate_json(raw)
    digest = hashlib.sha256(raw.encode()).hexdigest()
    with connect() as db:
        if only_if_empty and db.execute("SELECT 1 FROM entities LIMIT 1").fetchone():
            return {"status": "existing", "changed": 0}
        previous = db.execute("SELECT 1 FROM ingestion_runs WHERE digest=? AND status='completed'", (digest,)).fetchone()
        if previous:
            return {"status": "cached", "changed": 0}
        changed = 0
        for entity in bundle.entities:
            changed += save_record(db, "entity", entity, reason, validate=False)
        for entity in bundle.entities:
            validate_links(db, entity)
        for source in bundle.sources:
            changed += save_record(db, "source", source, reason)
        for claim in bundle.claims:
            changed += save_record(db, "claim", claim, reason)
        db.execute("INSERT INTO ingestion_runs(adapter,digest,status,detail,created_at) VALUES (?,?,?,?,?)", ("reviewed-bundle", digest, "completed", f"{changed} records changed", now()))
    return {"status": "completed", "changed": changed}

def initialize():
    migrate()
    ingest_bundle((ROOT / "research" / "collection.json").read_text(encoding="utf-8"), only_if_empty=True)
