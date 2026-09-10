"""Restricted, conditional refresh of explicitly licensed documentation.

No URL from a request or editable source record is fetched. The two reviewed
repository paths are an allowlist, not a general-purpose web scraper. Changed
documents are retained for human review and never create a supply-chain claim.
"""
import hashlib
import json
import logging
import time
from datetime import datetime, timezone

import httpx

from .database import connect, now

log = logging.getLogger("supply-atlas.ingestion")
PATHS = {
    "bcm2711-doc": "documentation/asciidoc/computers/processors/bcm2711.adoc",
    "keyboard-doc": "documentation/asciidoc/computers/keyboard-computers/intro.adoc",
}
MAX_BYTES = 2_000_000
MIN_REFRESH_SECONDS = 60


def affected_claims(db, source_id):
    return [r[0] for r in db.execute("SELECT DISTINCT claim_id FROM evidence WHERE source_id=? ORDER BY claim_id", (source_id,))]


def snapshot_record(db, row, include_body=False):
    result = dict(row)
    source = json.loads(result.pop("source_json"))
    result["affected_claim_ids"] = affected_claims(db, row["source_id"])
    if include_body:
        result["source"] = source
    else:
        result.pop("body")
    return result


def fetch_document(client, source, cached):
    path = PATHS.get(source["id"])
    expected = f"https://github.com/raspberrypi/documentation/blob/master/{path}"
    if not path or source["adapter"] != "raspberrypi-docs" or source["url"] != expected or source["license"] != "CC BY-SA 4.0":
        raise ValueError("Source no longer matches the reviewed URL and license allowlist; manual review required")
    url = f"https://raw.githubusercontent.com/raspberrypi/documentation/master/{path}"
    headers = {"User-Agent": "SupplyAtlas/1.0 (+https://github.com/jsantoru/supply-atlas)", "Accept": "text/plain", "Accept-Encoding": "identity"}
    if cached:
        for field, name in (("etag", "If-None-Match"), ("modified", "If-Modified-Since")):
            if cached[field]:
                headers[name] = cached[field]
    started = time.monotonic()
    with client.stream("GET", url, headers=headers) as response:
        if response.status_code == 304:
            if not cached or not cached["digest"]:
                raise ValueError("Received not-modified without a retained snapshot")
            return {"not_modified": True, "url": url}
        response.raise_for_status()
        if response.status_code != 200:
            raise ValueError("Documentation endpoint must return 200 or 304; redirects are not followed")
        mime = response.headers.get("content-type", "").split(";", 1)[0]
        if mime not in ("text/plain", "text/x-asciidoc", "application/octet-stream"):
            raise ValueError("Documentation endpoint returned an unsupported content type")
        if int(response.headers.get("content-length", "0")) > MAX_BYTES:
            raise ValueError("Documentation exceeds the 2 MB limit")
        content = bytearray()
        for chunk in response.iter_bytes():
            if len(content) + len(chunk) > MAX_BYTES or time.monotonic() - started > 25:
                raise ValueError("Documentation exceeds the size or elapsed-time limit")
            content.extend(chunk)
        body = content.decode("utf-8")
        if not body.strip():
            raise ValueError("Documentation response was empty")
        return {"not_modified": False, "url": url, "body": body, "digest": hashlib.sha256(content).hexdigest(), "etag": response.headers.get("etag"), "modified": response.headers.get("last-modified")}


def refresh_sources(client=None):
    results = []
    with connect() as db:
        sources = [json.loads(r[0]) for r in db.execute("SELECT payload FROM sources WHERE id IN (?,?) ORDER BY id", tuple(PATHS))]
    owned_client = client is None
    client = client or httpx.Client(timeout=httpx.Timeout(10, connect=5), follow_redirects=False, trust_env=False)
    try:
        for source in sources:
            with connect() as db:
                row = db.execute("SELECT * FROM source_cache WHERE source_id=?", (source["id"],)).fetchone()
                cached = dict(row) if row else None
            if cached and (datetime.now(timezone.utc) - datetime.fromisoformat(cached["checked_at"])).total_seconds() < MIN_REFRESH_SECONDS:
                results.append({"source_id": source["id"], "status": "cached", "detail": "Recently checked; retry after one minute."})
                continue
            try:
                fetched = fetch_document(client, source, cached)
                checked = now()
                with connect() as db:
                    db.execute("BEGIN IMMEDIATE")
                    if fetched["not_modified"]:
                        retained = db.execute("SELECT status FROM source_snapshots WHERE source_id=? AND digest=?", (source["id"], cached["digest"])).fetchone()
                        if not retained:
                            raise ValueError("Conditional cache does not have a retained document")
                        db.execute("UPDATE source_cache SET checked_at=?,status=? WHERE source_id=?", (checked, retained[0], source["id"]))
                        status, detail = "unchanged", "Conditional request confirms the retained document is unchanged."
                        digest = cached["digest"]
                    else:
                        digest = fetched["digest"]
                        existing = db.execute("SELECT id,status FROM source_snapshots WHERE source_id=? AND digest=?", (source["id"], digest)).fetchone()
                        if not existing:
                            db.execute("INSERT INTO source_snapshots(source_id,digest,fetch_url,body,source_json,retrieved_at) VALUES (?,?,?,?,?,?)", (source["id"], digest, fetched["url"], fetched["body"], json.dumps(source), checked))
                        state = existing["status"] if existing else "pending"
                        db.execute("INSERT INTO source_cache VALUES (?,?,?,?,?,?) ON CONFLICT(source_id) DO UPDATE SET etag=excluded.etag,modified=excluded.modified,digest=excluded.digest,checked_at=excluded.checked_at,status=excluded.status", (source["id"], fetched["etag"], fetched["modified"], digest, checked, state))
                        status = "unchanged" if existing else "queued"
                        detail = "Previously retained document; review state preserved." if existing else "Licensed document snapshot queued for human review. Claims remain unchanged."
                    db.execute("INSERT INTO ingestion_runs(adapter,digest,status,detail,created_at) VALUES (?,?,?,?,?)", ("raspberrypi-docs", digest, status, source["id"] + ": " + detail, checked))
                results.append({"source_id": source["id"], "status": status, "detail": detail})
            except (httpx.HTTPError, ValueError, UnicodeError) as exc:
                # Exception text can contain an upstream URL, but never credentials.
                detail = f"Documentation check failed: {type(exc).__name__}. Retry or inspect the source manually."
                log.warning("Refresh failed for %s: %s", source["id"], exc)
                with connect() as db:
                    db.execute("INSERT INTO source_cache(source_id,checked_at,status) VALUES (?,?,'failed') ON CONFLICT(source_id) DO UPDATE SET checked_at=excluded.checked_at,status=excluded.status", (source["id"], now()))
                    db.execute("INSERT INTO ingestion_runs(adapter,digest,status,detail,created_at) VALUES (?,'','failed',?,?)", ("raspberrypi-docs", source["id"] + ": " + detail, now()))
                results.append({"source_id": source["id"], "status": "failed", "detail": detail})
    finally:
        if owned_client:
            client.close()
    queued = sum(r["status"] == "queued" for r in results)
    failed = sum(r["status"] == "failed" for r in results)
    return {"detail": f"Checked {len(results)} licensed sources: {queued} queued for review, {failed} failed. Published claims were not changed.", "results": results}


def review_snapshot(snapshot_id, review):
    with connect() as db:
        db.execute("BEGIN IMMEDIATE")
        row = db.execute("SELECT * FROM source_snapshots WHERE id=?", (snapshot_id,)).fetchone()
        if not row:
            raise LookupError("Source snapshot not found")
        if row["digest"] != review.digest:
            raise ValueError("Snapshot digest does not match the reviewed document")
        if row["status"] != "pending":
            raise ValueError("Snapshot has already been reviewed")
        before = {k: row[k] for k in ("status", "reviewed_at", "review_reason")}
        after = {"status": review.decision, "reviewed_at": now(), "review_reason": review.reason}
        db.execute("UPDATE source_snapshots SET status=?,reviewed_at=?,review_reason=? WHERE id=?", (*after.values(), snapshot_id))
        db.execute("UPDATE source_cache SET status=? WHERE source_id=? AND digest=?", (review.decision, row["source_id"], row["digest"]))
        db.execute("INSERT INTO revisions(kind,record_id,before_json,after_json,reason,created_at) VALUES (?,?,?,?,?,?)", ("source-review", str(snapshot_id), json.dumps(before), json.dumps(after), review.reason, after["reviewed_at"]))
    return {"id": snapshot_id, "status": review.decision}
