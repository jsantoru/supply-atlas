"""Read-only release checks against the production server; standard library only."""
import json
import sys
from urllib.error import HTTPError
from urllib.request import urlopen

base = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5174").rstrip("/")

def get(path):
    with urlopen(base + path, timeout=15) as response:
        assert response.status == 200, path
        assert response.headers.get("X-Content-Type-Options") == "nosniff", path
        return response.read(), response.headers

health, _ = get("/api/health")
assert json.loads(health)["storage"] == "sqlite"
raw, _ = get("/api/atlas")
atlas = json.loads(raw)
entities = {e["id"]: e for e in atlas["entities"]}
sources = {s["id"] for s in atlas["sources"]}
assert len(entities) >= 35
for claim in atlas["claims"]:
    assert claim["evidence"] and claim["uncertainty"]
    assert all(e["source_id"] in sources for e in claim["evidence"])
raw, _ = get("/api/graph/pi5")
assert any(c.get("facility_id") == "pencoed" for c in json.loads(raw)["claims"])
raw, _ = get("/api/graph/pi500")
assert not any(c.get("facility_id") == "pencoed" for c in json.loads(raw)["claims"])
page, _ = get("/?view=teardown&product=pi5")
assert b"Supply Atlas" in page
image, headers = get("/products/pi5.png")
assert headers.get_content_type() == "image/png" and image.startswith(b"\x89PNG")
for product in ("mohajer6", "shahed238", "lucas"):
    raw, _ = get("/api/research/" + product)
    dossier = json.loads(raw)
    assert dossier["product_id"] == product and not dossier["missing_source_ids"]
    assert dossier["systems"] and dossier["people"] and dossier["manufacturing"]
    if product == "lucas":
        assert dossier["network"]["edges"]
        assert all(ref["source_id"] in sources for edge in dossier["network"]["edges"] for ref in edge["evidence"])
    image, headers = get("/products/" + product + ".png")
    assert headers.get_content_type() == "image/png" and image.startswith(b"\x89PNG")
for path in ("/api/admin/status", "/api/does-not-exist"):
    try:
        get(path)
        raise AssertionError("Protected or unknown route unexpectedly public: " + path)
    except HTTPError as exc:
        assert exc.code in ((401, 503) if "admin" in path else (404,))
print(f"Production smoke passed: {len(entities)} entities, {len(atlas['claims'])} scoped claims, {len(sources)} sources; SQLite, assets, evidence and authentication verified.")
