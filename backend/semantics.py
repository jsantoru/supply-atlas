"""Claims, not company adjacency, are the unit of traversal."""
def eligible(claim, status="all", role="all", at=None, variant=None):
    if status != "all" and claim["status"] != status:
        return False
    if role != "all" and claim["role"] != role:
        return False
    if at and (claim["observed_at"] > at or (claim.get("valid_from") and claim["valid_from"] > at) or (claim.get("valid_to") and claim["valid_to"] < at)):
        return False
    return not (variant and claim.get("variant_id") and claim["variant_id"] != variant)

def product_claims(data, product, **filters):
    return [c for c in data["claims"] if c["product_id"] == product and eligible(c, **filters)]

def dependencies(data, product, **filters):
    direct = product_claims(data, product, **filters)
    scope_filters = {**filters, "role": "all"}
    parts = {c["part_id"] for c in product_claims(data, product, **scope_filters) if c["part_id"]}
    # Only part-level claims may be inherited. Never inherit another product's factories.
    upstream = [c for c in data["claims"] if c["product_id"] is None and c["part_id"] in parts and eligible(c, **filters)]
    return direct + upstream

def graph(data, product, depth=2, **filters):
    claims = dependencies(data, product, **filters)
    edges = []
    for c in claims:
        part = c["part_id"] or c["product_id"]
        pairs = []
        if c["part_id"] and c["product_id"]:
            pairs.append((c["part_id"], c["product_id"], "used in", 1))
        if c["supplier_id"] and part:
            pairs.append((c["supplier_id"], part, c["role"], 2 if c["part_id"] else 1))
        if c["facility_id"] and part:
            pairs.append((c["facility_id"], part, c["role"] + " at", 2 if c["part_id"] else 1))
        if c["material_id"] and part:
            pairs.append((c["material_id"], part, "material input", 3))
        for src, target, label, level in pairs:
            if src != target and level <= depth:
                edges.append({"id": f"{c['id']}:{src}:{target}", "source": src, "target": target, "label": label, "claim_id": c["id"], "product_context": product, "status": c["status"], "upstream": c["product_id"] is None})
    ids = {product} | {e[k] for e in edges for k in ("source", "target")}
    return {"nodes": [e for e in data["entities"] if e["id"] in ids], "edges": edges, "claims": claims}

def scenario(data, target, **filters):
    entities = {e["id"]: e for e in data["entities"]}
    matches = {target}
    if entities[target]["kind"] == "region":
        # Only facility location creates geographic exposure; company HQ never does.
        matches |= {e["id"] for e in data["entities"] if e["kind"] == "facility" and e.get("region_id") == target}
    results = []
    for product in (e for e in data["entities"] if e["kind"] == "product"):
        paths = []
        for claim in dependencies(data, product["id"], **filters):
            if any(claim.get(k) in matches for k in ("supplier_id", "facility_id", "material_id", "part_id", "region_id")):
                paths.append({"claim_id": claim["id"], "part_id": claim["part_id"], "status": claim["status"], "basis": "product-specific" if claim["product_id"] else "shared specific part; sourcing period not confirmed for each product"})
        if paths:
            results.append({"product": product, "paths": paths})
    return {"target": entities[target], "products": results, "method": "Hypothetical scenario. Count distinct products with a matching documented dependency; include part-level upstream links explicitly. No production shares, probabilities, sole-source assertions, or confirmation of present-day sourcing. Unknown links can hide additional exposure."}

def comparison(data, left, right, **filters):
    def summarize(id):
        entity = next(e for e in data["entities"] if e["id"] == id)
        claims = dependencies(data, id, **filters) if entity["kind"] == "product" else [c for c in data["claims"] if c["supplier_id"] == id and eligible(c, **filters)]
        return {"entity": entity, "claims": len(claims), "direct": sum(c["status"] == "direct" for c in claims), "parts": sorted({c["part_id"] for c in claims if c["part_id"]}), "suppliers": sorted({c["supplier_id"] for c in claims if c["supplier_id"]}), "facilities": sorted({c["facility_id"] for c in claims if c["facility_id"]}), "unknown_location_claims": sum(not c["facility_id"] for c in claims)}
    a, b = summarize(left), summarize(right)
    return {"left": a, "right": b, "shared_parts": sorted(set(a["parts"]) & set(b["parts"])), "shared_suppliers": sorted(set(a["suppliers"]) & set(b["suppliers"])), "coverage": "Counts describe this researched collection, not the complete bill of materials or all sourcing options."}
