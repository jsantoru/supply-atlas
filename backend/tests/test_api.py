import json
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import connect, initialize, ingest_bundle

@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_PATH",str(tmp_path/"test.sqlite3"))
    monkeypatch.setenv("ADMIN_TOKEN","a"*40)
    with TestClient(app) as client:
        yield client

def test_end_to_end(client):
    assert client.get("/api/health").status_code==200
    d=client.get("/api/atlas").json()
    assert len(d["entities"])>20
    assert client.get("/api/entities?q=Taiwan").json()[0]["id"]=="tsmc"
    g=client.get("/api/graph/pi5").json()
    c=next(c for c in g["claims"] if c["facility_id"])
    source=next(s for s in d["sources"] if s["id"]==c["evidence"][0]["source_id"])
    assert source["url"].startswith("https://www.raspberrypi.com/")
    assert client.get("/api/graph/missing").status_code==404
    assert client.get("/api/graph/pi5?depth=9").status_code==422
    assert client.get("/api/graph/pi5?status=bogus").status_code==422

def test_admin_denied_and_revision_persists(client):
    assert client.get("/api/admin/status").status_code==401
    headers={"Authorization":"Bearer "+"a"*40}
    entity=client.get("/api/entities?q=BCM2712").json()[0]
    entity["aliases"].append("Example correction")
    response=client.put("/api/admin/entity/"+entity["id"],json={"record":entity,"reason":"Verified alternate entity label"},headers=headers)
    assert response.status_code==200,response.text
    initialize()
    assert client.get("/api/entities?q=Example correction").json()
    status=client.get("/api/admin/status",headers=headers).json()
    assert status["revisions"][0]["reason"]=="Verified alternate entity label"

def test_invalid_relationship_rolls_back(client):
    c=client.get("/api/atlas").json()["claims"][0]
    c["facility_id"]="tsmc"
    r=client.put("/api/admin/claim/"+c["id"],json={"record":c,"reason":"Testing invalid facility assignment"},headers={"Authorization":"Bearer "+"a"*40})
    assert r.status_code==422

def test_rate_limit(client):
    for _ in range(10):
        assert client.get("/api/admin/status").status_code==401
    assert client.get("/api/admin/status").status_code==429
