import copy
import json

import httpx
import pytest
from fastapi.testclient import TestClient

from backend import ingestion
from backend import database
from backend.database import connect, initialize, sync_curated
from backend.main import app

AUTH = {"Authorization": "Bearer " + "a" * 40}


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "ingestion.sqlite3"))
    monkeypatch.setenv("ADMIN_TOKEN", "a" * 40)
    monkeypatch.setattr(ingestion, "MIN_REFRESH_SECONDS", 0)
    with TestClient(app) as api:
        yield api


def bundle(entities=None, sources=None, claims=None):
    return {"entities": entities or [], "sources": sources or [], "claims": claims or []}


def submit(client, data):
    return client.post("/api/admin/import", headers=AUTH, json={"reason": "Reviewed source references and entity resolution", "bundle": data})


def mock_client(handler):
    return httpx.Client(transport=httpx.MockTransport(handler), follow_redirects=False)


def document(request):
    assert request.url.host == "raw.githubusercontent.com"
    assert request.url.path.endswith(tuple(ingestion.PATHS.values()))
    return httpx.Response(200, text="= Licensed documentation\nBCM2711 processor reference.\n", headers={"Content-Type": "text/plain", "ETag": '"v1"'})


def test_all_administrative_mutations_require_authentication(client):
    for path, body in (("/api/admin/refresh", {}), ("/api/admin/import", {}), ("/api/admin/snapshots/1/review", {})):
        assert client.post(path, json=body).status_code == 401
    assert client.get("/api/admin/snapshots/1").status_code == 401
    assert client.get("/api/admin/revisions/1").status_code == 401


def test_refresh_retains_attributed_text_and_never_changes_claims(client):
    original = client.get("/api/atlas").json()
    with mock_client(document) as upstream:
        result = ingestion.refresh_sources(upstream)
    assert [r["status"] for r in result["results"]] == ["queued", "queued"]
    status = client.get("/api/admin/status", headers=AUTH).json()
    assert len(status["snapshots"]) == 2
    snapshot = client.get(f"/api/admin/snapshots/{status['snapshots'][0]['id']}", headers=AUTH)
    assert snapshot.headers["cache-control"] == "no-store"
    snapshot = snapshot.json()
    assert snapshot["source"]["license"] == "CC BY-SA 4.0"
    assert snapshot["source"]["publisher"] == "Raspberry Pi Ltd"
    assert snapshot["body"].startswith("= Licensed")
    assert snapshot["affected_claim_ids"]
    assert client.get("/api/atlas").json() == original


def test_conditional_cache_and_review_survive_restart(client):
    with mock_client(document) as upstream:
        ingestion.refresh_sources(upstream)
    snapshot = client.get("/api/admin/status", headers=AUTH).json()["snapshots"][0]
    request = {"digest": snapshot["digest"], "decision": "acknowledged", "reason": "Reviewed retained document against existing evidence"}
    path = f"/api/admin/snapshots/{snapshot['id']}/review"
    assert client.post(path, headers=AUTH, json={**request, "digest": "0" * 64}).status_code == 409
    assert client.post(path, headers=AUTH, json=request).status_code == 200
    assert client.post(path, headers=AUTH, json=request).status_code == 409
    def unchanged(request):
        assert request.headers["If-None-Match"] == '"v1"'
        return httpx.Response(304)
    with mock_client(unchanged) as upstream:
        result = ingestion.refresh_sources(upstream)
    assert all(r["status"] == "unchanged" for r in result["results"])
    initialize()
    result = client.get(f"/api/admin/snapshots/{snapshot['id']}", headers=AUTH).json()
    assert result["status"] == "acknowledged"
    assert result["review_reason"] == request["reason"]
    with connect() as db:
        assert db.execute("SELECT count(*) FROM source_snapshots").fetchone()[0] == 2
        assert db.execute("SELECT count(*) FROM revisions WHERE kind='source-review'").fetchone()[0] == 1


def test_source_changes_create_pending_versions_and_preserve_history(client):
    with mock_client(document) as upstream:
        ingestion.refresh_sources(upstream)
    def changed(request):
        return httpx.Response(200, text="= Revised licensed documentation\nNew source wording.", headers={"Content-Type": "text/plain", "ETag": '"v2"'})
    with mock_client(changed) as upstream:
        assert all(r["status"] == "queued" for r in ingestion.refresh_sources(upstream)["results"])
    with mock_client(changed) as upstream:
        assert all(r["status"] == "unchanged" for r in ingestion.refresh_sources(upstream)["results"])
    with connect() as db:
        assert db.execute("SELECT count(*) FROM source_snapshots").fetchone()[0] == 4
        assert db.execute("SELECT count(DISTINCT digest) FROM source_snapshots").fetchone()[0] == 2


@pytest.mark.parametrize("response", [
    httpx.Response(302, headers={"Location": "http://127.0.0.1/admin"}),
    httpx.Response(200, text="<html>Not documentation</html>", headers={"Content-Type": "text/html"}),
    httpx.Response(200, text="large", headers={"Content-Type": "text/plain", "Content-Length": "2000001"}),
    httpx.Response(304),
])
def test_unsafe_or_invalid_document_responses_fail_without_partial_snapshots(client, response):
    with mock_client(lambda request: response) as upstream:
        assert all(r["status"] == "failed" for r in ingestion.refresh_sources(upstream)["results"])
    with connect() as db:
        assert db.execute("SELECT count(*) FROM source_snapshots").fetchone()[0] == 0
        assert db.execute("SELECT count(*) FROM ingestion_runs WHERE status='failed'").fetchone()[0] == 2


def test_editable_source_url_cannot_turn_adapter_into_a_request_proxy(client):
    source = next(s for s in client.get("/api/atlas").json()["sources"] if s["id"] == "bcm2711-doc")
    source["url"] = "http://127.0.0.1/private"
    assert client.put("/api/admin/source/bcm2711-doc", headers=AUTH, json={"record": source, "reason": "Testing reviewed source URL restriction"}).status_code == 200
    calls = []
    def handler(request):
        calls.append(str(request.url))
        return document(request)
    with mock_client(handler) as upstream:
        results = ingestion.refresh_sources(upstream)["results"]
    assert results[0]["status"] == "failed"
    assert len(calls) == 1 and "keyboard-computers" in calls[0]


def test_import_is_idempotent_and_validates_the_whole_transaction(client):
    entity = {"id": "reviewed-test-company", "kind": "company", "name": "Reviewed test company", "description": "Isolated test record"}
    assert submit(client, bundle(entities=[entity])).json()["changed"] == 1
    assert submit(client, bundle(entities=[entity])).json() == {"status": "cached", "changed": 0}
    with connect() as db:
        before = db.execute("SELECT count(*) FROM revisions").fetchone()[0]
    bad = {**entity, "id": "new-test-company", "name": "New test company", "parent_id": "nonexistent"}
    result = submit(client, bundle(entities=[bad]))
    assert result.status_code == 422
    with connect() as db:
        assert not db.execute("SELECT 1 FROM entities WHERE id=?", (bad["id"],)).fetchone()
        assert db.execute("SELECT count(*) FROM revisions").fetchone()[0] == before


def test_resolution_rejects_duplicates_type_changes_and_cycles(client):
    duplicate = {"id": "duplicate-tsmc", "kind": "company", "name": "ＴＳＭＣ", "description": "Isolated test record"}
    assert submit(client, bundle(entities=[duplicate])).status_code == 422
    original = next(e for e in client.get("/api/atlas").json()["entities"] if e["id"] == "tsmc")
    assert submit(client, bundle(entities=[{**original, "kind": "facility"}])).status_code == 422
    company = {"kind": "company", "description": "Isolated hierarchy test"}
    a, b = {**company, "id": "test-a", "name": "Test A", "parent_id": "test-b"}, {**company, "id": "test-b", "name": "Test B", "parent_id": "test-a"}
    assert submit(client, bundle(entities=[a, b])).status_code == 422
    assert submit(client, bundle(entities=[a, a])).status_code == 422
    claim = client.get("/api/atlas").json()["claims"][0]
    assert submit(client, bundle(claims=[{**claim, "id": "duplicate-claim"}])).status_code == 422


def test_reparenting_variant_cannot_invalidate_an_existing_claim(client):
    data = client.get("/api/atlas").json()
    claim = copy.deepcopy(next(c for c in data["claims"] if c["product_id"] == "pi5"))
    claim.update(id="variant-specific-test", variant_id="pi5-4gb")
    assert submit(client, bundle(claims=[claim])).status_code == 200
    variant = next(e for e in data["entities"] if e["id"] == "pi5-4gb")
    variant["parent_id"] = "pi4"
    assert client.put("/api/admin/entity/pi5-4gb", headers=AUTH, json={"record": variant, "reason": "Test variant parent integrity validation"}).status_code == 422


def test_general_commercial_claim_does_not_create_product_dependencies(client):
    graph = client.get("/api/graph/pi5").json()
    claim = copy.deepcopy(client.get("/api/atlas").json()["claims"][0])
    claim.update(id="commercial-test", product_id=None, part_id=None, facility_id=None, material_id=None, supplier_id="tsmc", customer_id="sony")
    assert submit(client, bundle(claims=[claim])).status_code == 200
    assert client.get("/api/graph/pi5").json() == graph


def test_release_collection_adds_records_without_overwriting_admin_corrections(client):
    original = client.get("/api/atlas").json()
    curated = {key: original[key] for key in ("entities", "sources", "claims")}
    changed = copy.deepcopy(curated)
    for entity in changed["entities"]:
        if entity["id"] == "tsmc":
            entity["description"] = "Updated curated description"
    modified = next(e for e in original["entities"] if e["id"] == "tsmc")
    modified["description"] = "Administrator reviewed description that must survive upgrades"
    assert client.put("/api/admin/entity/tsmc", headers=AUTH, json={"record": modified, "reason": "Preserve the administrator evidence correction"}).status_code == 200
    changed["entities"].append({"id": "release-company", "kind": "company", "name": "Release test company", "description": "Isolated release fixture"})
    result = sync_curated(json.dumps(changed))
    assert result["changed"] == 1 and result["conflicts"] == ["entity/tsmc"]
    assert client.get("/api/entities/tsmc").json()["entity"]["description"] == modified["description"]
    assert client.get("/api/entities/release-company").status_code == 200
    assert sync_curated(json.dumps(changed))["status"] == "cached"


def test_request_size_limit_and_import_review_reason(client):
    assert client.post("/api/admin/import", headers=AUTH, json={"reason": "short", "bundle": bundle()}).status_code == 422
    assert client.post("/api/admin/import", headers=AUTH, content=b"x" * 2_000_001).status_code == 413


def test_conflicting_release_keeps_existing_database_available(client, tmp_path, monkeypatch):
    operator = {"id": "operator-product", "kind": "product", "name": "Future Board", "description": "Operator reviewed addition"}
    assert submit(client, bundle(entities=[operator])).status_code == 200
    original = client.get("/api/atlas").json()
    incoming = {key: original[key] for key in ("entities", "sources", "claims")}
    incoming["entities"] = [e for e in incoming["entities"] if e["id"] != operator["id"]]
    incoming["entities"].append({**operator, "id": "release-product"})
    research = tmp_path / "replacement-release" / "research"
    research.mkdir(parents=True)
    (research / "collection.json").write_text(json.dumps(incoming))
    monkeypatch.setattr(database, "ROOT", research.parent)
    assert initialize()["status"] == "failed"
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/atlas").json() == original
    status = client.get("/api/admin/status", headers=AUTH).json()
    assert status["runs"][0]["status"] == "failed"
    assert "operator-product" in status["runs"][0]["detail"]
