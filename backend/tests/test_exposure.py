import copy
from backend.tests.test_semantics import data
from backend.semantics import comparison, exposure, scenario


def test_supplier_comparison_exposes_same_part_upstream_without_self_supplier():
    result = comparison(data(), 'raspberry-pi', 'broadcom')
    assert result['left']['entity']['kind'] == 'company'
    assert 'tsmc' in result['left']['suppliers']
    assert 'raspberry-pi' not in result['left']['suppliers']
    assert result['left']['evidence_sources'] > 0
    assert 'commercial purchase' in result['coverage']


def test_observed_concentration_keeps_roles_and_products_separate():
    result = exposure(data(), {'pi5', 'pi500'})
    rows = result['concentration']
    assert any(r['product_id'] == 'pi5' and r['part_id'] == 'rp1' and r['role'] == 'fabricator' and r['supplier_ids'] == ['tsmc'] for r in rows)
    assert any(r['product_id'] == 'pi500' and r['part_id'] == 'rp1' and r['role'] == 'designer' for r in rows)
    assert result['unknown_geography_contexts'] > 0
    assert result['claim_contexts'] == result['located_contexts'] + result['unknown_geography_contexts']
    assert 'sole sourcing' in result['method']


def test_geographic_exposure_does_not_leak_pencoed_to_pi500():
    result = exposure(data(), {'pi500'})
    assert result['regions'] == []
    pi5 = exposure(data(), {'pi5'})
    assert any('pencoed' in r['facility_ids'] for r in pi5['regions'])


def test_shared_upstream_references_claim_and_contexts():
    result = exposure(data(), {'pi5', 'pi500'})
    rows = result['shared_upstream']
    assert any(r['part_id'] == 'rp1' and r['product_ids'] == ['pi5', 'pi500'] and r['status'] == 'inferred' for r in rows)
    assert all(r['claim_id'] in {c['id'] for c in data()['claims']} for r in rows)


def test_disputed_generic_link_remains_disputed_in_scenario():
    collection = copy.deepcopy(data())
    for claim in collection['claims']:
        if claim['supplier_id'] == 'tsmc':
            claim['status'] = 'disputed'
    result = scenario(collection, 'tsmc')
    assert all(path['status'] == 'disputed' for item in result['products'] for path in item['paths'])

def test_effective_evidence_filter_matches_context_status_and_preserves_anchors():
    from backend.semantics import graph
    collection = data()
    assert scenario(collection, 'tsmc', status='direct')['products'] == []
    assert {r['product']['id'] for r in scenario(collection, 'tsmc', status='inferred')['products']} == {'pi5', 'pi500', 'pico', 'pico-w', 'pico2'}
    network = graph(collection, 'pi5', status='inferred')
    assert network['edges']
    assert all(edge['status'] == 'inferred' for edge in network['edges'])
    assert all(edge['anchor_claim_ids'] for edge in network['edges'])
    assert any(edge['target'] == 'pi5' for edge in network['edges'])
    assert not any(edge['upstream'] for edge in graph(collection, 'pi5', status='direct')['edges'])

def test_unfiltered_product_edge_uses_inclusion_evidence_without_shadowing():
    from backend.semantics import graph
    network = graph(data(), 'pi500')
    matches = [edge for edge in network['edges'] if edge['source'] == 'rp1' and edge['target'] == 'pi500']
    assert len(matches) == 1
    assert matches[0]['claim_id'] == 'pi500-rp1'
    assert not matches[0]['upstream']

def test_disputed_product_usage_cannot_be_laundered_through_direct_part_source():
    from backend.semantics import graph
    collection = copy.deepcopy(data())
    next(c for c in collection['claims'] if c['id'] == 'pi5-rp1')['status'] = 'disputed'
    assert not any(edge['claim_id'] == 'rp1-fabrication' for edge in graph(collection, 'pi5', status='inferred')['edges'])
    disputed = graph(collection, 'pi5', status='disputed')
    assert any(edge['claim_id'] == 'rp1-fabrication' and edge['status'] == 'disputed' for edge in disputed['edges'])
    assert next(c for c in disputed['claims'] if c['id'] == 'rp1-fabrication')['context_status'] == 'disputed'
