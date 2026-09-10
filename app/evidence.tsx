import { ArrowRight, CircleHelp, Factory, MapPin } from 'lucide-react';
import type { Atlas, Claim, Entity } from './types';
import { SourceLink, Status, EntityIcon } from './controls';
export function EvidenceCard({
  claim,
  data,
  onEntity,
  onClaim,
  anchorClaims,
}: {
  claim: Claim;
  data: Atlas;
  onEntity: (id: string) => void;
  onClaim: (id: string) => void;
  anchorClaims: Claim[];
}) {
  const name = (id: string) =>
    data.entities.find((e) => e.id === id)?.name || id;
  return (
    <article className="evidence-card">
      <div className="row-between">
        <Status value={claim.status} />
        <span className="muted">Observed {claim.observed_at}</span>
      </div>
      <h3>
        {claim.role.charAt(0).toUpperCase() + claim.role.slice(1)} relationship
      </h3>
      <div className="relationship-line">
        {[
          claim.supplier_id,
          claim.material_id,
          claim.part_id,
          claim.product_id || claim.customer_id,
        ]
          .filter((v): v is string => !!v)
          .map((id, i) => (
            <span key={id}>
              {i > 0 && <ArrowRight size={14} />}
              <button className="text-link" onClick={() => onEntity(id)}>
                {name(id)}
              </button>
            </span>
          ))}
      </div>
      <dl>
        <dt>Manufacturing location</dt>
        <dd>
          {claim.facility_id ? (
            <button
              className="text-link"
              onClick={() => onEntity(claim.facility_id!)}
            >
              {name(claim.facility_id)}
            </button>
          ) : (
            'Not established'
          )}
        </dd>
        <dt>Variant / geography</dt>
        <dd>
          {claim.variant_id ? name(claim.variant_id) : 'Variant unspecified'} /{' '}
          {claim.region_id ? name(claim.region_id) : 'Geography unspecified'}
        </dd>
        <dt>Applicable period</dt>
        <dd>{claim.period}</dd>
      </dl>
      <div className="uncertainty">
        <CircleHelp size={17} />
        <p>{claim.uncertainty}</p>
      </div>
      {claim.product_id === null && claim.part_id && (
        <p className="notice">
          Part-level evidence. A connection to a product using this part is an
          inference; product-specific allocation is unconfirmed.
        </p>
      )}
      {anchorClaims.length > 0 && (
        <section className="source-record">
          <h4>Product allocation evidence</h4>
          <p>
            The source below describes the upstream part. These separate
            observations describe reported usage of that exact part. Their
            evidence status also limits the allocation; product-specific
            sourcing remains an inference.
          </p>
          {anchorClaims.map((anchor) => (
            <button
              className="list-link"
              key={anchor.id}
              onClick={() => onClaim(anchor.id)}
            >
              {name(anchor.product_id!)} · {anchor.role}
              <Status value={anchor.status} />
              <ArrowRight size={15} />
            </button>
          ))}
        </section>
      )}
      {!claim.product_id && !claim.part_id && !claim.material_id && (
        <p className="notice">
          General commercial relationship. This record does not establish a
          component, product or factory allocation.
        </p>
      )}
      {claim.evidence.map((e, i) => {
        const source = data.sources.find((s) => s.id === e.source_id);
        return source ? (
          <div className="source-record" key={i}>
            <span className="eyebrow">Supporting source</span>
            <SourceLink href={source.url}>{source.title}</SourceLink>
            <p>
              {source.publisher} ·{' '}
              {source.published || 'Publication date unavailable'}
            </p>
            <p>
              <strong>Precise reference:</strong> {e.reference}
            </p>
            <p>Retrieved {source.retrieved}</p>
            <details>
              <summary>Reuse and licensing</summary>
              <p>{source.license}</p>
              <p>{source.reuse}</p>
              <SourceLink href={source.terms_url}>Source terms</SourceLink>
            </details>
          </div>
        ) : null;
      })}
      {claim.supersedes && (
        <p>
          Supersedes claim {claim.supersedes}. Previous observations remain in
          the record.
        </p>
      )}
    </article>
  );
}
export function EntityDetails({
  entity,
  data,
  onEntity,
  onClaim,
  onProduct,
  onScenario,
}: {
  entity: Entity;
  data: Atlas;
  onEntity: (id: string) => void;
  onClaim: (id: string) => void;
  onProduct: (id: string) => void;
  onScenario: (id: string) => void;
}) {
  const scopeIds = new Set([entity.id]);
  if (['category', 'industry', 'region'].includes(entity.kind)) {
    data.entities.forEach((e) => {
      if (
        e.category_id === entity.id ||
        e.industry_id === entity.id ||
        e.region_id === entity.id
      )
        scopeIds.add(e.id);
    });
  }
  const claims = data.claims.filter((c) =>
    [
      c.supplier_id,
      c.customer_id,
      c.part_id,
      c.product_id,
      c.facility_id,
      c.material_id,
      c.region_id,
      c.variant_id,
    ].some((id) => !!id && scopeIds.has(id)),
  );
  const children = data.entities.filter(
    (e) =>
      e.parent_id === entity.id ||
      e.category_id === entity.id ||
      e.industry_id === entity.id ||
      e.region_id === entity.id,
  );
  const relatedParts = new Set(
    claims.filter((c) => !c.product_id && c.part_id).map((c) => c.part_id),
  );
  const products = data.entities.filter(
    (e) =>
      e.kind === 'product' &&
      data.claims.some(
        (c) =>
          c.product_id === e.id &&
          (claims.includes(c) || relatedParts.has(c.part_id)),
      ),
  );
  return (
    <>
      {entity.kind === 'facility' ? (
        <section className="factory-profile-hero">
          <div className="factory-profile-mark">
            <Factory size={52} strokeWidth={1.25} />
            <span>Documented facility</span>
          </div>
          <p>
            <MapPin size={15} />
            {data.entities.find((e) => e.id === entity.region_id)?.name ||
              'Region not established'}
          </p>
          <strong>
            {[...new Set(claims.map((c) => c.role))].join(' · ') ||
              'Manufacturing role unknown'}
          </strong>
          <span>
            {entity.precision} location · {products.length} connected{' '}
            {products.length === 1 ? 'product' : 'products'}
          </span>
        </section>
      ) : (
        <div className="profile-symbol">
          <EntityIcon kind={entity.kind} size={28} />
        </div>
      )}
      <p>{entity.description}</p>
      {entity.aliases.length > 0 && (
        <p className="muted">Also known as: {entity.aliases.join(', ')}</p>
      )}
      {entity.location_reference && (
        <p className="notice">{entity.location_reference}</p>
      )}
      {entity.kind === 'facility' && entity.latitude !== null && (
        <p className="footnote">
          Coordinates: {entity.latitude}, {entity.longitude}. A map pin locates
          the facility; each manufacturing relationship needs its own evidence.
        </p>
      )}
      <div className="profile-pills">
        {[
          entity.category_id,
          entity.industry_id,
          entity.region_id,
          entity.parent_id,
        ]
          .filter((id): id is string => !!id)
          .map((id) => (
            <button className="text-link" key={id} onClick={() => onEntity(id)}>
              {data.entities.find((e) => e.id === id)?.name || id}
              <ArrowRight size={13} />
            </button>
          ))}
      </div>
      <div className="actions">
        {entity.kind === 'product' && (
          <button className="cc-button" onClick={() => onProduct(entity.id)}>
            Explore product
          </button>
        )}
        {['company', 'facility', 'region', 'part', 'material'].includes(
          entity.kind,
        ) && (
          <button
            className="cc-button cc-button--secondary"
            onClick={() => onScenario(entity.id)}
          >
            Explore disruption
          </button>
        )}
      </div>
      {products.length > 0 && (
        <section>
          <h3>Connected products</h3>
          <p className="muted">
            Includes explicitly labeled part-level upstream dependencies.
          </p>
          {products.map((p) => (
            <button
              className="list-link"
              key={p.id}
              onClick={() => onProduct(p.id)}
            >
              <span>
                {p.name}
                {entity.kind === 'facility' && (
                  <small>
                    {[
                      ...new Set(
                        claims
                          .filter((c) => c.product_id === p.id)
                          .map((c) => c.role),
                      ),
                    ].join(' · ') || 'Part-level upstream connection'}
                  </small>
                )}
              </span>
              <ArrowRight size={16} />
            </button>
          ))}
        </section>
      )}
      {children.length > 0 && (
        <section>
          <h3>Browse related entities</h3>
          {children.map((p) => (
            <button
              className="list-link"
              key={p.id}
              onClick={() => onEntity(p.id)}
            >
              {p.name}
              <ArrowRight size={16} />
            </button>
          ))}
        </section>
      )}
      <section>
        <h3>
          Documented relationships{' '}
          <span className="muted">({claims.length})</span>
        </h3>
        {claims.length ? (
          claims.map((c) => (
            <button
              className="claim-link"
              key={c.id}
              onClick={() => onClaim(c.id)}
            >
              <span>
                <strong>
                  {data.entities.find((e) => e.id === c.part_id)?.name ||
                    c.role}
                </strong>
                <small>
                  {c.role} · {c.observed_at}
                </small>
              </span>
              <Status value={c.status} />
            </button>
          ))
        ) : (
          <p>
            No relationships are documented in this collection. This does not
            establish that none exist.
          </p>
        )}
      </section>
    </>
  );
}
