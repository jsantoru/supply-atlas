"""Research context must remain independently cited and outside supply inference."""
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.dossiers import dossiers, research_profile
from backend.main import app
from backend.models import Bundle
from backend.research.drone_research import DOSSIERS
from backend.semantics import graph, scenario


def collection():
    path = Path(__file__).parents[1] / "research" / "collection.json"
    return Bundle.model_validate_json(path.read_text(encoding="utf-8")).model_dump(mode="json")


def test_research_artifact_and_all_citations_are_consistent():
    raw = Path(__file__).parents[1] / "research" / "drone_dossiers.json"
    assert json.loads(raw.read_text(encoding="utf-8")) == DOSSIERS
    data = collection()
    entities = {entity["id"]: entity for entity in data["entities"]}
    sources = {source["id"]: source for source in data["sources"]}
    assert set(dossiers()) == {"mohajer6", "shahed238"}
    for product, dossier in dossiers().items():
        assert entities[product]["kind"] == "product"
        assert dossier.reviewed == "2026-09-10"
        for entry in dossier.entries():
            assert entry.evidence
            if entry.entity_id:
                assert entities[entry.entity_id]["kind"] == "company"
            for reference in entry.evidence:
                assert reference.source_id in sources
                assert sources[reference.source_id]["adapter"] == "manual-reference"
        profile = research_profile(product, data)
        assert not profile["missing_source_ids"]
        assert len(profile["sources"]) >= 9


def test_context_never_creates_component_or_facility_edges():
    data = collection()
    for product, company in (("mohajer6", "qods-aviation"), ("shahed238", "shahed-aviation")):
        result = graph(data, product, depth=3)
        assert {entity["id"] for entity in result["nodes"]} == {product, company}
        assert all(not claim["part_id"] and not claim["facility_id"] for claim in result["claims"])
        assert {row["product"]["id"] for row in scenario(data, company)["products"]} == {product}
    shahed = next(entity for entity in data["entities"] if entity["id"] == "shahed238")
    assert "Geran-3" not in shahed["aliases"]
    assert not graph(data, "shahed238", status="direct")["claims"]


def test_research_source_missing_is_visible_without_invented_link():
    data = collection()
    data["sources"] = [source for source in data["sources"] if source["id"] != "s238-csis"]
    result = research_profile("shahed238", data)
    assert result["missing_source_ids"] == ["s238-csis"]
    assert all(source["id"] != "s238-csis" for source in result["sources"])
    assert research_profile("pi5", data) is None


@pytest.mark.parametrize("product", ["mohajer6", "shahed238"])
def test_public_dossier_api_and_filtered_attributions(tmp_path, monkeypatch, product):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "research.sqlite3"))
    with TestClient(app) as client:
        response = client.get(f"/api/research/{product}")
        assert response.status_code == 200
        assert response.json()["product_id"] == product
        assert response.json()["missing_source_ids"] == []
        summary = client.get("/api/atlas").json()["research"][product]
        assert summary["system_count"] == len(response.json()["systems"])
        assert client.get("/api/research/pi5").status_code == 404
        assert client.get("/api/research/qods-aviation").status_code == 404
        assert client.get("/api/research/missing").status_code == 404
        assert client.get(f"/api/graph/{product}?at=2000-01-01").json()["claims"] == []
