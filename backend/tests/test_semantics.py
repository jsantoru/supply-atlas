import copy
import json
from pathlib import Path
from backend.models import Bundle
from backend.semantics import graph, scenario, comparison

def data():
    return Bundle.model_validate_json((Path(__file__).parents[1]/"research"/"collection.json").read_text()).model_dump(mode="json")

def test_factory_does_not_propagate_through_shared_supplier():
    d=data()
    assert {r["product"]["id"] for r in scenario(d,"pencoed")["products"]} == {"pi5"}
    assert "pencoed" not in {n["id"] for n in graph(d,"pi500")["nodes"]}

def test_part_upstream_shared_explicitly():
    d=data()
    affected=scenario(d,"tsmc")["products"]
    assert {r["product"]["id"] for r in affected} == {"pi5","pi500","pico","pico-w","pico2"}
    assert all("not confirmed" in p["basis"] for r in affected for p in r["paths"])

def test_comparison_and_roles():
    d=data()
    assert comparison(d,"pi5","pi500")["shared_parts"] == ["bcm2712","rp1"]
    assert all(c["role"]=="assembler" for c in graph(d,"pi5",role="assembler")["claims"])
    assert graph(d,"pi5",role="fabricator")["claims"][0]["supplier_id"] == "tsmc"

def test_time_and_variant_boundaries():
    d=data()
    assert not graph(d,"pi5",at="2020-01-01")["edges"]
    c=copy.deepcopy(d["claims"][0]); c["id"]="variant-only"; c["variant_id"]="pi5-4gb"
    d["claims"]=[c]
    assert not graph(d,"pi5",variant="pi5-8gb")["edges"]

def test_edges_always_retain_claim_and_product_context():
    d=data(); g=graph(d,"pi5")
    assert all(e["claim_id"] in {c["id"] for c in d["claims"]} and e["product_context"]=="pi5" for e in g["edges"])
    assert len(graph(d,"pi5",depth=1)["edges"]) < len(g["edges"])

def test_no_invented_material_or_fab_location():
    d=data()
    assert not scenario(d,"silicon")["products"]
    assert all(c["facility_id"] is None for c in d["claims"] if c["role"]=="fabricator")
