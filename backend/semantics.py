"""Claims, not company adjacency, are the unit of traversal."""
def eligible(claim, status="all", role="all", at=None, variant=None, supplier=None, part=None):
    if status != "all" and claim["status"] != status:
        return False
    if role != "all" and claim["role"] != role:
        return False
    if supplier and claim["supplier_id"] != supplier:
        return False
    if part and claim["part_id"] != part:
        return False
    if at and (claim["observed_at"] > at or (claim.get("valid_from") and claim["valid_from"] > at) or (claim.get("valid_to") and claim["valid_to"] < at)):
        return False
    return not (variant and claim.get("variant_id") and claim["variant_id"] != variant)

def product_claims(data, product, **filters):
    return [c for c in data["claims"] if c["product_id"] == product and eligible(c, **filters)]

def dependencies(data, product, **filters):
    direct = product_claims(data, product, **filters)
    scope_filters = {**filters, "role": "all", "supplier": None, "status": "all"}
    parts = {c["part_id"] for c in product_claims(data, product, **scope_filters) if c["part_id"]}
    # Only part-level claims may be inherited. Never inherit another product's factories.
    upstream = [c for c in data["claims"] if c["product_id"] is None and c["part_id"] in parts and eligible(c, **{**filters, "status": "all"}) and (filters.get("status", "all") == "all" or product_status(data, product, c, **filters) == filters["status"])]
    return direct + upstream

def graph(data, product, depth=2, **filters):
    claims = dependencies(data, product, **filters)
    edges = []
    for c in claims:
        part = c["part_id"] or c["product_id"]
        pairs = []
        if c["part_id"] and c["product_id"]:
            pairs.append((c["part_id"], c["product_id"], "used in", 1))
        elif c["part_id"] and not any(anchor["part_id"] == c["part_id"] and anchor["product_id"] == product for anchor in claims):
            pairs.append((c["part_id"], product, "part-level allocation", 1))
        if c["supplier_id"] and part:
            pairs.append((c["supplier_id"], part, c["role"], 2 if c["part_id"] else 1))
        if c["facility_id"] and part:
            pairs.append((c["facility_id"], part, c["role"] + " at", 2 if c["part_id"] else 1))
        if c["material_id"] and part:
            pairs.append((c["material_id"], part, "material input", 3))
        for src, target, label, level in pairs:
            if src != target and level <= depth:
                anchors = [anchor["id"] for anchor in product_claims(data, product, **{**filters, "status": "all", "role": "all", "supplier": None}) if anchor["part_id"] == c["part_id"]] if c["product_id"] is None else []
                edges.append({"id": f"{c['id']}:{src}:{target}", "source": src, "target": target, "label": label, "claim_id": c["id"], "anchor_claim_ids": anchors, "product_context": product, "status": product_status(data, product, c, **filters), "upstream": c["product_id"] is None})
    ids = {product} | {e[k] for e in edges for k in ("source", "target")}
    return {"nodes": [e for e in data["entities"] if e["id"] in ids], "edges": edges, "claims": [{**c, "context_status": product_status(data, product, c, **filters)} for c in claims]}

def contextual_status(claim):
    """A direct part observation is only an inferred product allocation."""
    return "inferred" if not claim["product_id"] and claim["status"] == "direct" else claim["status"]


def product_status(data, product, claim, **filters):
    status = contextual_status(claim)
    if claim["product_id"] or status in ("disputed", "outdated"):
        return status
    anchors = [c for c in product_claims(data, product, **{**filters, "status": "all", "role": "all", "supplier": None}) if c["part_id"] == claim["part_id"]]
    if anchors and not any(c["status"] in ("direct", "inferred") for c in anchors):
        return "disputed" if any(c["status"] == "disputed" for c in anchors) else "outdated"
    return status


def exposure(data, product_ids, **filters):
    """Observed counts, grouped by product/part/role; never shares or risk scores."""
    entities = {e["id"]: e for e in data["entities"]}
    groups, regions, shared = {}, {}, {}
    unknown, located, count = 0, 0, 0
    for product_id in sorted(product_ids):
        for c in dependencies(data, product_id, **filters):
            count += 1
            key = (product_id, c["part_id"], c["role"])
            group = groups.setdefault(key, {"product_id": product_id, "part_id": c["part_id"], "role": c["role"], "supplier_ids": set(), "claim_ids": set()})
            if c["supplier_id"]:
                group["supplier_ids"].add(c["supplier_id"])
            group["claim_ids"].add(c["id"])
            facility = entities.get(c["facility_id"], {})
            region = c["region_id"] or facility.get("region_id")
            if region:
                row = regions.setdefault(region, {"region_id": region, "product_ids": set(), "facility_ids": set(), "claim_ids": set()})
                row["product_ids"].add(product_id)
                if c["facility_id"]:
                    row["facility_ids"].add(c["facility_id"])
                row["claim_ids"].add(c["id"])
                located += 1
            else:
                unknown += 1
            if not c["product_id"]:
                row = shared.setdefault(c["id"], {"claim_id": c["id"], "part_id": c["part_id"], "supplier_id": c["supplier_id"], "product_ids": set(), "status": product_status(data, product_id, c, **filters)})
                if product_status(data, product_id, c, **filters) in ("disputed", "outdated"):
                    row["status"] = product_status(data, product_id, c, **filters)
                row["product_ids"].add(product_id)
    def serial(row):
        return {key: sorted(value) if isinstance(value, set) else value for key, value in row.items()}
    return {"concentration": [serial(row) for row in groups.values()],
            "regions": [serial(row) for row in regions.values()],
            "shared_upstream": [serial(row) for row in shared.values() if len(row["product_ids"]) > 1],
            "claim_contexts": count, "located_contexts": located, "unknown_geography_contexts": unknown,
            "method": "Each count is one claim in one product context. Supplier counts group the same product, specific part and role, under the selected date/evidence filters. Multiple records can describe different periods or variants; one observed supplier does not establish sole sourcing. Geography uses an explicit claim region or a documented facility region, never headquarters. A generic part-level link is an inferred allocation to each product; no company-to-company purchase is implied."}


def scenario(data, target, **filters):
    entities = {e["id"]: e for e in data["entities"]}
    matches = {target}
    if entities[target]["kind"] == "region":
        matches |= {e["id"] for e in data["entities"] if e["kind"] == "facility" and e.get("region_id") == target}
    results = []
    for product in (e for e in data["entities"] if e["kind"] == "product"):
        paths = []
        for claim in dependencies(data, product["id"], **filters):
            if any(claim.get(k) in matches for k in ("supplier_id", "facility_id", "material_id", "part_id", "region_id")):
                paths.append({"claim_id": claim["id"], "part_id": claim["part_id"], "status": product_status(data, product["id"], claim, **filters), "basis": "product-specific" if claim["product_id"] else "shared specific part; sourcing period not confirmed for each product"})
        if paths:
            results.append({"product": product, "paths": paths})
    return {"target": entities[target], "products": results,
            "observations": exposure(data, {r["product"]["id"] for r in results}, **filters),
            "method": "Hypothetical scenario. Count distinct products with a matching documented dependency; include part-level upstream links explicitly. No production shares, probabilities, sole-source assertions, or confirmation of present-day sourcing. Unknown links can hide additional exposure."}


def comparison(data, left, right, **filters):
    entities = {e["id"]: e for e in data["entities"]}
    def summarize(id):
        entity = entities[id]
        if entity["kind"] == "product":
            claims = dependencies(data, id, **filters)
            upstream = claims
            products = {id}
        else:
            claims = [c for c in data["claims"] if c["supplier_id"] == id and eligible(c, **filters)]
            parts = {c["part_id"] for c in claims if c["part_id"]}
            # Related exact-part records are useful for comparison, but never establish a commercial purchase.
            upstream = [c for c in data["claims"] if not c["product_id"] and c["part_id"] in parts and c["supplier_id"] != id and eligible(c, **filters)]
            products = {p["id"] for p in data["entities"] if p["kind"] == "product" and any(c["supplier_id"] == id for c in dependencies(data, p["id"], **filters))}
        regions = {c["region_id"] or entities.get(c["facility_id"], {}).get("region_id") for c in claims}
        return {"entity": entity, "claims": len(claims), "direct": sum((product_status(data, id, c, **filters) if entity["kind"] == "product" else c["status"]) == "direct" for c in claims),
                "parts": sorted({c["part_id"] for c in claims if c["part_id"]}),
                "suppliers": sorted({c["supplier_id"] for c in upstream if c["supplier_id"]}),
                "facilities": sorted({c["facility_id"] for c in claims if c["facility_id"]}),
                "regions": sorted(regions - {None}), "products": sorted(products),
                "evidence_sources": len({e["source_id"] for c in claims for e in c["evidence"]}),
                "unknown_location_claims": sum(not c["facility_id"] for c in claims),
                "claim_ids": [c["id"] for c in claims]}
    a, b = summarize(left), summarize(right)
    return {"left": a, "right": b,
            "shared_parts": sorted(set(a["parts"]) & set(b["parts"])),
            "shared_suppliers": sorted(set(a["suppliers"]) & set(b["suppliers"])),
            "shared_regions": sorted(set(a["regions"]) & set(b["regions"])),
            "shared_products": sorted(set(a["products"]) & set(b["products"])),
            "coverage": "Counts describe this researched collection, not the complete bill of materials or all sourcing options. Supplier comparison shows the supplier's own scoped claims and generic upstream records for the same exact parts; it does not infer a commercial purchase between companies. Unknown factories and geography remain unknown."}
