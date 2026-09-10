"""Acceptance regressions for the manually researched expansion.

These test evidence scope, not whether the collection is a complete BOM.
"""
import json
from pathlib import Path

from backend.models import Bundle
from backend.research.build_collection import claims, entities, sources
from backend.semantics import dependencies, graph, scenario


def collection():
    raw = Path(__file__).parents[1] / "research" / "collection.json"
    return Bundle.model_validate_json(raw.read_text(encoding="utf-8")).model_dump(mode="json")


def test_collection_compiler_matches_reviewed_artifact():
    raw = Path(__file__).parents[1] / "research" / "collection.json"
    assert json.loads(raw.read_text(encoding="utf-8")) == {
        "entities": entities, "sources": sources, "claims": claims
    }


def test_factory_scope_survives_new_companies_products_and_regions():
    data = collection()
    expected = {
        "pi5": {"pencoed"},
        "mac-pro-2019": {"mac-pro-austin"},
        "galaxy-s9": {"samsung-noida"},
    }
    for product in (e["id"] for e in data["entities"] if e["kind"] == "product"):
        records = dependencies(data, product)
        assert {c["facility_id"] for c in records if c["facility_id"]} == expected.get(product, set())
    assert {p["product"]["id"] for p in scenario(data, "texas")["products"]} == {"mac-pro-2019"}
    assert {p["product"]["id"] for p in scenario(data, "uttar-pradesh")["products"]} == {"galaxy-s9"}
    # A supplier's assembly site cannot become a wafer fab for its own chips.
    assert all(not c["facility_id"] for c in data["claims"] if c["role"] == "fabricator")
    assert all(c["role"] == "assembler" for c in data["claims"] if c["facility_id"])


def test_unknown_operator_and_approximate_locations_stay_explicit():
    data = collection()
    facilities = [e for e in data["entities"] if e["kind"] == "facility"]
    assert len(facilities) >= 3
    assert all(f["precision"] == "approximate" and f["location_reference"] for f in facilities)
    austin = next(e for e in facilities if e["id"] == "mac-pro-austin")
    assembly = next(c for c in data["claims"] if c["id"] == "mac-pro-2019-final-assembly")
    assert austin["parent_id"] is None
    assert assembly["supplier_id"] is None
    assert assembly["customer_id"] == "apple"
    assert "Americas" in assembly["uncertainty"]


def test_configuration_filters_do_not_combine_competing_processors():
    data = collection()
    exynos = {c["part_id"] for c in dependencies(data, "galaxy-s9", variant="galaxy-s9-exynos")}
    snapdragon = {c["part_id"] for c in dependencies(data, "galaxy-s9", variant="galaxy-s9-snapdragon")}
    assert "exynos-9810" in exynos and "snapdragon-845" not in exynos
    assert "snapdragon-845" in snapdragon and "exynos-9810" not in snapdragon
    assembly = next(c for c in data["claims"] if c["id"] == "galaxy-s9-final-assembly")
    assert assembly["variant_id"] is None  # No documented chipset allocation at Noida.
    assert "Individual chipset variants" in assembly["uncertainty"]


def test_material_relationship_does_not_invent_upstream_supplier_or_factory():
    data = collection()
    material_claim = next(c for c in data["claims"] if c["material_id"] == "aluminium")
    assert material_claim["part_id"] == "mac-pro-2019-housing"
    assert material_claim["product_id"] == "mac-pro-2019"
    assert material_claim["supplier_id"] is None and material_claim["facility_id"] is None
    material_edges = [e for e in graph(data, "mac-pro-2019", depth=3)["edges"] if e["source"] == "aluminium"]
    assert len(material_edges) == 1
    assert material_edges[0]["target"] == "mac-pro-2019-housing"
    assert {r["product"]["id"] for r in scenario(data, "aluminium")["products"]} == {"mac-pro-2019"}
    assert not any(c["material_id"] == "silicon" for c in data["claims"])


def test_shared_microcontroller_process_has_context_and_no_fab():
    data = collection()
    result = scenario(data, "tsmc")
    assert {row["product"]["id"] for row in result["products"]} == {"pi5", "pi500", "pico", "pico-w", "pico2"}
    assert all(path["status"] == "inferred" for row in result["products"] for path in row["paths"])
    pico_and_wireless = [{c["part_id"] for c in dependencies(data, product)} for product in ("pico", "pico-w")]
    assert "rp2040" in pico_and_wireless[0] & pico_and_wireless[1]
    assert not any(c["facility_id"] for c in dependencies(data, "pico2"))


def test_restricted_sources_cannot_enter_automatic_adapter():
    data = collection()
    automatic = {s["id"] for s in data["sources"] if s["adapter"] != "manual-reference"}
    assert automatic == {"keyboard-doc", "bcm2711-doc"}
    by_source = {s["id"]: s for s in data["sources"]}
    for claim in data["claims"]:
        assert claim["uncertainty"] and claim["period"] and claim["evidence"]
        for evidence in claim["evidence"]:
            source = by_source[evidence["source_id"]]
            assert evidence["reference"] and source["terms_url"] and source["reuse"]
            assert source["published"] is None or source["published"] <= source["retrieved"]
