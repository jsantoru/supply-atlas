import { useEffect, useState } from 'react';
import { ArrowRight, FlaskConical, GitCompareArrows } from 'lucide-react';
import { api, type Atlas, type Entity } from './types';
import { Empty, ErrorState, Picker, Status } from './controls';
type ComparisonSide = {
  entity: Entity;
  claims: number;
  direct: number;
  parts: string[];
  suppliers: string[];
  facilities: string[];
  regions: string[];
  products: string[];
  evidence_sources: number;
  unknown_location_claims: number;
};
type Comparison = {
  left: ComparisonSide;
  right: ComparisonSide;
  shared_parts: string[];
  shared_suppliers: string[];
  shared_regions: string[];
  shared_products: string[];
  coverage: string;
};
export function CompareView({
  data,
  left,
  setLeft,
  other,
  setOther,
  filters,
  onEntity,
}: {
  data: Atlas;
  left: string;
  setLeft: (id: string) => void;
  other: string;
  setOther: (id: string) => void;
  filters: string;
  onEntity: (id: string) => void;
}) {
  const [result, setResult] = useState<Comparison | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setResult(null);
    api<Comparison>(`/api/compare?left=${left}&right=${other}&${filters}`, {
      signal: controller.signal,
    })
      .then(setResult)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      });
    return () => controller.abort();
  }, [left, other, filters, retry]);
  const options = data.entities.filter((e) =>
    ['product', 'company'].includes(e.kind),
  );
  const name = (id: string) =>
    data.entities.find((e) => e.id === id)?.name || id;
  return (
    <div className="analysis-view">
      <div className="section-intro">
        <GitCompareArrows />
        <div>
          <h2>Find the dependencies in common</h2>
          <p>
            Compare documented sourcing and coverage across products or
            suppliers.
          </p>
        </div>
      </div>
      <div className="compare-pickers">
        <Picker
          label="First product or supplier"
          value={left}
          onChange={setLeft}
          options={options}
        />
        <Picker
          label="Compare with"
          value={other}
          onChange={setOther}
          options={options}
        />
      </div>
      {error ? (
        <ErrorState error={error} retry={() => setRetry((v) => v + 1)} />
      ) : result ? (
        <>
          <div className="compare-grid">
            {[result.left, result.right].map((side, i) => (
              <section key={i}>
                <h3>{side.entity.name}</h3>
                <dl className="comparison-metrics">
                  <dt>Documented claims</dt>
                  <dd>{side.claims}</dd>
                  <dt>Directly supported claims</dt>
                  <dd>{side.direct}</dd>
                  <dt>Supporting publications</dt>
                  <dd>{side.evidence_sources}</dd>
                  <dt>Claims without a facility</dt>
                  <dd>{side.unknown_location_claims}</dd>
                </dl>
                <h4>
                  {side.entity.kind === 'company'
                    ? 'Upstream suppliers for the same parts'
                    : 'Known suppliers'}
                </h4>
                {side.suppliers.length ? (
                  side.suppliers.map((id) => (
                    <button
                      className="list-link"
                      key={id}
                      onClick={() => onEntity(id)}
                    >
                      {name(id)}
                      <ArrowRight size={15} />
                    </button>
                  ))
                ) : (
                  <p>None documented</p>
                )}
                <h4>Documented locations</h4>
                {side.facilities.length ? (
                  side.facilities.map((id) => (
                    <button
                      key={id}
                      className="text-link"
                      onClick={() => onEntity(id)}
                    >
                      {name(id)}
                    </button>
                  ))
                ) : (
                  <p>Location unknown</p>
                )}
                <h4>Documented geography</h4>
                <p>
                  {side.regions.map(name).join(', ') || 'Geography unknown'}
                </p>
                <h4>
                  {side.entity.kind === 'company'
                    ? 'Documented parts supplied'
                    : 'Documented parts'}
                </h4>
                <div className="profile-pills">
                  {side.parts.map((id) => (
                    <button
                      className="text-link"
                      key={id}
                      onClick={() => onEntity(id)}
                    >
                      {name(id)}
                    </button>
                  ))}
                </div>
                {side.entity.kind === 'company' && (
                  <>
                    <h4>Connected products</h4>
                    {side.products.length ? (
                      side.products.map((id) => (
                        <button
                          className="list-link"
                          key={id}
                          onClick={() => onEntity(id)}
                        >
                          {name(id)}
                          <ArrowRight size={15} />
                        </button>
                      ))
                    ) : (
                      <p>Unknown in this collection</p>
                    )}
                  </>
                )}
              </section>
            ))}
          </div>
          <section className="shared-panel">
            <h3>Shared dependencies</h3>
            <p>
              Parts:{' '}
              {result.shared_parts.map(name).join(', ') || 'None documented'}
            </p>
            <p>
              Suppliers:{' '}
              {result.shared_suppliers.map(name).join(', ') ||
                'None documented'}
            </p>
            <p className="footnote">
              Shared suppliers do not establish shared factories or sole
              sourcing.
            </p>
            <p>
              Regions:{' '}
              {result.shared_regions.map(name).join(', ') || 'None documented'}
            </p>
            {result.left.entity.kind === 'company' &&
              result.right.entity.kind === 'company' && (
                <p>
                  Products:{' '}
                  {result.shared_products.map(name).join(', ') ||
                    'None documented'}
                </p>
              )}
          </section>
          <p className="footnote">{result.coverage}</p>
        </>
      ) : (
        <p role="status">Comparing documented dependencies…</p>
      )}
    </div>
  );
}
type Scenario = {
  target: Entity;
  products: {
    product: Entity;
    paths: {
      claim_id: string;
      part_id: string;
      status: string;
      basis: string;
    }[];
  }[];
  method: string;
  observations: {
    concentration: {
      product_id: string;
      part_id: string | null;
      role: string;
      supplier_ids: string[];
      claim_ids: string[];
    }[];
    regions: {
      region_id: string;
      product_ids: string[];
      facility_ids: string[];
      claim_ids: string[];
    }[];
    shared_upstream: {
      claim_id: string;
      part_id: string;
      supplier_id: string | null;
      product_ids: string[];
      status: string;
    }[];
    claim_contexts: number;
    unknown_geography_contexts: number;
    method: string;
  };
};
export function RiskView({
  data,
  target,
  setTarget,
  filters,
  onProduct,
  onClaim,
}: {
  data: Atlas;
  target: string;
  setTarget: (id: string) => void;
  filters: string;
  onProduct: (id: string) => void;
  onClaim: (id: string) => void;
}) {
  const [result, setResult] = useState<Scenario | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const name = (id: string | null) =>
    data.entities.find((e) => e.id === id)?.name || 'Unspecified part';
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setResult(null);
    api<Scenario>(`/api/scenario/${target}?${filters}`, {
      signal: controller.signal,
    })
      .then(setResult)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      });
    return () => controller.abort();
  }, [target, filters, retry]);
  return (
    <div className="analysis-view">
      <div className="section-intro">
        <FlaskConical />
        <div>
          <h2>What if a dependency were disrupted?</h2>
          <p>A hypothetical scenario, not a report of an actual event.</p>
        </div>
      </div>
      <Picker
        label="Disrupted supplier, facility or region"
        value={target}
        onChange={setTarget}
        options={data.entities.filter((e) =>
          ['company', 'facility', 'region', 'part', 'material'].includes(
            e.kind,
          ),
        )}
      />
      {error ? (
        <ErrorState error={error} retry={() => setRetry((v) => v + 1)} />
      ) : result ? (
        <>
          <div className="scenario-summary">
            <span className="big-number">{result.products.length}</span>
            <div>
              <strong>potentially connected products</strong>
              <p>
                Within the documented collection · production impact is not
                quantified
              </p>
            </div>
          </div>
          {result.products.length ? (
            result.products.map((r) => (
              <section className="scenario-product" key={r.product.id}>
                <button
                  className="list-link"
                  onClick={() => onProduct(r.product.id)}
                >
                  <strong>{r.product.name}</strong>
                  <ArrowRight size={18} />
                </button>
                {r.paths.map((p, i) => (
                  <button
                    className="path-row"
                    key={i}
                    onClick={() => onClaim(p.claim_id)}
                  >
                    <span>
                      {data.entities.find((e) => e.id === p.part_id)?.name ||
                        'Assembly'}
                      <small>{p.basis}</small>
                    </span>
                    <Status value={p.status} />
                  </button>
                ))}
              </section>
            ))
          ) : (
            <Empty
              title="No documented path found"
              text="This means exposure is unknown, not zero. Additional supplier or facility relationships may exist."
            />
          )}
          {result.products.length > 0 && (
            <section className="exposure-observations">
              <h3>Observed dependencies of the connected products</h3>
              <p>
                These observations cover all filtered relationships of the
                products above. They describe the collection’s coverage, not the
                scale of a disruption.
              </p>
              <div className="compare-grid">
                <section>
                  <h4>Geographic exposure</h4>
                  {result.observations.regions.length ? (
                    result.observations.regions.map((r) => (
                      <div className="audit-row" key={r.region_id}>
                        <strong>{name(r.region_id)}</strong>
                        <span>{r.product_ids.map(name).join(', ')}</span>
                        <small>
                          {r.facility_ids.length} documented facilities ·{' '}
                          {r.claim_ids.length} distinct claims
                        </small>
                        <button
                          className="text-link"
                          onClick={() => onClaim(r.claim_ids[0])}
                        >
                          Inspect location evidence
                        </button>
                      </div>
                    ))
                  ) : (
                    <p>No geographic exposure established.</p>
                  )}
                  <p className="footnote">
                    Geography is unknown for{' '}
                    {result.observations.unknown_geography_contexts} of{' '}
                    {result.observations.claim_contexts} claim contexts.
                  </p>
                </section>
                <section>
                  <h4>Shared upstream dependencies</h4>
                  {result.observations.shared_upstream.length ? (
                    result.observations.shared_upstream.map((r) => (
                      <button
                        className="claim-link"
                        key={r.claim_id}
                        onClick={() => onClaim(r.claim_id)}
                      >
                        <span>
                          <strong>
                            {name(r.supplier_id)} · {name(r.part_id)}
                          </strong>
                          <small>{r.product_ids.map(name).join(', ')}</small>
                          <small>
                            Exact part is shared; product allocation is
                            unconfirmed.
                          </small>
                        </span>
                        <Status value={r.status} />
                      </button>
                    ))
                  ) : (
                    <p>
                      No shared generic upstream claim documented for these
                      products.
                    </p>
                  )}
                </section>
              </div>
              <details className="concentration-details">
                <summary>
                  Observed supplier concentration by part and role
                </summary>
                <p>
                  A count of one is one known supplier in this collection; it is
                  not evidence of sole sourcing.
                </p>
                {result.observations.concentration.map((r, i) => (
                  <div className="audit-row" key={i}>
                    <strong>
                      {name(r.product_id)} · {name(r.part_id)} · {r.role}
                    </strong>
                    <span>
                      {r.supplier_ids.length} known{' '}
                      {r.supplier_ids.length === 1 ? 'supplier' : 'suppliers'}:{' '}
                      {r.supplier_ids.map(name).join(', ') || 'None identified'}
                    </span>
                    <button
                      className="text-link"
                      onClick={() => onClaim(r.claim_ids[0])}
                    >
                      Inspect supporting claim
                    </button>
                  </div>
                ))}
              </details>
            </section>
          )}
          <div className="notice">
            <h3>How this scenario is calculated</h3>
            <p>{result.method}</p>
            <p>{result.observations.method}</p>
          </div>
        </>
      ) : (
        <p role="status">Tracing documented dependencies…</p>
      )}
    </div>
  );
}
