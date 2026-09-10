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
  unknown_location_claims: number;
};
type Comparison = {
  left: ComparisonSide;
  right: ComparisonSide;
  shared_parts: string[];
  shared_suppliers: string[];
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
                  <dt>Claims without a facility</dt>
                  <dd>{side.unknown_location_claims}</dd>
                </dl>
                <h4>Known suppliers</h4>
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
                    <Status
                      value={
                        p.basis === 'product-specific' ? p.status : 'inferred'
                      }
                    />
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
          <div className="notice">
            <h3>How this scenario is calculated</h3>
            <p>{result.method}</p>
            <p>
              Observed supplier concentration counts known dependencies only. A
              single recorded supplier is not a confirmed sole source. Geography
              follows documented facilities, never a company’s headquarters.
            </p>
          </div>
        </>
      ) : (
        <p role="status">Tracing documented dependencies…</p>
      )}
    </div>
  );
}
