import { useEffect, useState, type CSSProperties } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  ChevronRight,
  CircleHelp,
  Eye,
  Layers3,
  Maximize2,
  Plane,
  RotateCcw,
  Scan,
  Users,
} from 'lucide-react';
import { api, type Atlas, type Claim, type Entity, type Source } from './types';
import { ErrorState, Status } from './controls';
import './research.css';

type Entry = {
  id: string;
  title: string;
  text: string;
  basis: 'observed' | 'attributed' | 'context' | 'unresolved';
  date: string;
  evidence: { source_id: string; reference: string }[];
  entity_id?: string;
};
type Dossier = {
  product_id: string;
  reviewed: string;
  subtitle: string;
  introduction: string;
  scope: string;
  systems: Entry[];
  timeline: Entry[];
  organizations: Entry[];
  people: Entry[];
  manufacturing: Entry[];
  assessment: Entry[];
  sources: Source[];
  missing_source_ids: string[];
};
type Props = {
  product: Entity;
  data: Atlas;
  claims: Claim[];
  onEntity: (id: string) => void;
  onClaim: (id: string) => void;
  onProduct: (id: string) => void;
};
const basisLabels = {
  observed: 'Visual / reported observation',
  attributed: 'Attributed source statement',
  context: 'Historical context',
  unresolved: 'Unresolved',
};

export default function ResearchStudio(props: Props) {
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setDossier(null);
    api<Dossier>(`/api/research/${props.product.id}`, {
      signal: controller.signal,
    })
      .then(setDossier)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      });
    return () => controller.abort();
  }, [props.product.id, retry]);
  if (error)
    return <ErrorState error={error} retry={() => setRetry((v) => v + 1)} />;
  if (!dossier) return <p role="status">Loading cited research dossier…</p>;
  return <DossierView key={dossier.product_id} {...props} dossier={dossier} />;
}

function DossierView({
  product,
  data,
  claims,
  onEntity,
  onClaim,
  onProduct,
  dossier,
}: Props & { dossier: Dossier }) {
  const [selected, setSelected] = useState(dossier.systems[0].id);
  const [separation, setSeparation] = useState(0);
  const [angle, setAngle] = useState(0);
  const [tilt, setTilt] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const current = dossier.systems.find((entry) => entry.id === selected)!;
  const prefix = `research-${product.id}`;
  const other = product.id === 'mohajer6' ? 'shahed238' : 'mohajer6';
  const names = new Map(data.entities.map((e) => [e.id, e.name]));
  const sourceNumbers = new Map(dossier.sources.map((s, i) => [s.id, i + 1]));
  const sourcesById = new Map(dossier.sources.map((s) => [s.id, s]));
  const citations = (entry: Entry) => (
    <span className="research-citations">
      {entry.evidence.map((ref) => {
        const source = sourcesById.get(ref.source_id);
        return source ? (
          <a
            key={ref.source_id}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            title={`${source.title} — ${ref.reference}`}
            aria-label={`Source ${sourceNumbers.get(source.id)}: ${source.title}. ${ref.reference}`}
          >
            [{sourceNumbers.get(source.id)}]
          </a>
        ) : (
          <span key={ref.source_id}>[Source unavailable: {ref.source_id}]</span>
        );
      })}
    </span>
  );
  const renderEntry = (entry: Entry) => (
    <article
      key={entry.id}
      className={`research-entry research-${entry.basis}`}
      id={`${prefix}-${entry.id}`}
    >
      <div className="research-entry-meta">
        <span>{entry.date}</span>
        <span>{basisLabels[entry.basis]}</span>
      </div>
      <h4>{entry.title}</h4>
      <p>
        {entry.text} {citations(entry)}
      </p>
      {entry.entity_id && (
        <button
          className="research-text-link"
          onClick={() => onEntity(entry.entity_id!)}
        >
          Open organization profile <ArrowRight size={15} />
        </button>
      )}
    </article>
  );
  const sections = [
    {
      id: 'timeline',
      title: 'Program chronology',
      short: 'Chronology',
      entries: dossier.timeline,
    },
    {
      id: 'organizations',
      title: 'Organizations and institutional relationships',
      short: 'Organizations',
      entries: dossier.organizations,
    },
    {
      id: 'people',
      title: 'People in the public record',
      short: 'People',
      entries: dossier.people,
    },
    {
      id: 'manufacturing',
      title: 'Manufacturing and location evidence',
      short: 'Manufacturing',
      entries: dossier.manufacturing,
    },
    {
      id: 'assessment',
      title: 'Evidence boundaries and unresolved questions',
      short: 'Evidence limits',
      entries: dossier.assessment,
    },
  ];
  return (
    <div className="research-dossier">
      <p className="research-filter-note">
        <BookOpen size={16} /> Dossier covers all cited dates. Workspace filters
        apply to supply claims only.
      </p>
      {!!dossier.missing_source_ids.length && (
        <p role="alert">
          Some source records are unavailable. Missing citations are identified
          below.
        </p>
      )}
      <div className="research-studio-grid">
        <section
          className="research-canvas"
          aria-label={`${product.name} interactive systems illustration`}
        >
          <div className="studio-topline">
            <span>
              <Plane size={17} /> Aircraft studio
            </span>
            <span className="studio-tag">Conceptual systems overview</span>
          </div>
          <div className="research-canvas-heading">
            <p>{dossier.subtitle}</p>
            <h2>Explore the aircraft.</h2>
            <span>Visible form. Dated evidence.</span>
          </div>
          <div
            className="studio-view-controls"
            aria-label="Aircraft view controls"
          >
            <button
              aria-label="Toggle angled view"
              aria-pressed={tilt}
              onClick={() => setTilt((v) => !v)}
            >
              <Maximize2 size={18} />
            </button>
            <button
              aria-label="Rotate product"
              onClick={() => setAngle((v) => (v >= 8 ? -8 : v + 8))}
            >
              <RotateCcw size={18} />
            </button>
            <button
              aria-label="Reset product view"
              onClick={() => {
                setAngle(0);
                setTilt(false);
                setSeparation(0);
              }}
            >
              <Scan size={18} />
            </button>
          </div>
          <div
            className="research-airframe-stage"
            style={
              {
                '--research-angle': `${angle}deg`,
                '--research-tilt': tilt ? '20deg' : '0deg',
                '--research-separation': separation / 100,
              } as CSSProperties
            }
          >
            {!imageFailed ? (
              <img
                className="research-airframe"
                src={`/products/${product.id}.png`}
                width="1536"
                height="1024"
                onError={() => setImageFailed(true)}
                alt={`AI-generated illustrative rendering of ${product.name}; exterior only, not a measured model`}
              />
            ) : (
              <div className="research-image-error" role="status">
                <Plane size={40} />
                <p>
                  Exterior illustration unavailable. The cited system cards
                  remain available.
                </p>
              </div>
            )}
            <div
              className={`research-system-labels ${separation ? 'is-separated' : ''}`}
              aria-label="Conceptual system cards"
            >
              {dossier.systems.map((entry, i) => (
                <button
                  key={entry.id}
                  aria-label={`Inspect ${entry.title}`}
                  aria-pressed={selected === entry.id}
                  onClick={() => {
                    setSelected(entry.id);
                    setSeparation((v) => v || 65);
                  }}
                  style={{ '--system-index': i } as CSSProperties}
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <strong>{entry.title}</strong>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>
          <div className="studio-controls">
            <button
              className="studio-explode"
              onClick={() => setSeparation((v) => (v ? 0 : 85))}
            >
              <Layers3 size={18} />
              {separation ? 'Gather system cards' : 'Separate system cards'}
            </button>
            <label className="studio-slider">
              <span>
                Card separation <output>{separation}%</output>
              </span>
              <input
                aria-label="System card separation"
                type="range"
                min="0"
                max="100"
                value={separation}
                onChange={(e) => setSeparation(Number(e.target.value))}
              />
            </label>
          </div>
          <p className="studio-disclosure">
            AI-generated exterior illustration · conceptual labels, not internal
            component positions · no measured CAD or mechanical disassembly.
          </p>
        </section>
        <aside
          className="research-inspector"
          aria-label="Selected major system"
        >
          <div className="research-inspector-heading">
            <Eye size={19} />
            <h3>Major systems</h3>
            <span>{dossier.systems.length}</span>
          </div>
          <div
            className="research-system-list"
            aria-label="Major system selection"
          >
            {dossier.systems.map((entry, i) => (
              <button
                key={entry.id}
                aria-pressed={entry.id === selected}
                onClick={() => setSelected(entry.id)}
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
                {entry.title}
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
          <div className="research-selected" aria-live="polite">
            <span className="research-basis">{basisLabels[current.basis]}</span>
            <h4>{current.title}</h4>
            <p>
              {current.text} {citations(current)}
            </p>
            <small>{current.date}</small>
          </div>
          <p className="research-inspector-note">
            <CircleHelp size={17} /> System topics are descriptive categories,
            not a component count or procurement list.
          </p>
        </aside>
      </div>
      <section className="research-overview" aria-label="Research scope">
        <div>
          <p className="studio-section-label">The research record</p>
          <h3>{product.name}, in context.</h3>
          <p>{dossier.introduction}</p>
          <p>{dossier.scope}</p>
        </div>
        <div className="research-overview-facts">
          <span>
            <BookOpen size={21} />
            <strong>{dossier.sources.length}</strong> cited sources
          </span>
          <span>
            <Users size={21} />
            <strong>
              {
                dossier.people.filter((entry) => entry.basis !== 'unresolved')
                  .length
              }
            </strong>{' '}
            leadership records
          </span>
          <small>Reviewed {dossier.reviewed}</small>
          <button onClick={() => onProduct(other)}>
            Explore {names.get(other)} <ArrowRight size={16} />
          </button>
        </div>
      </section>
      <nav
        className="research-jump-links"
        aria-label="Research dossier sections"
      >
        {sections.map((section) => (
          <a key={section.id} href={`#${prefix}-${section.id}`}>
            {section.short}
            <span>{section.entries.length}</span>
          </a>
        ))}
        <a href={`#${prefix}-sources`}>
          Sources<span>{dossier.sources.length}</span>
        </a>
      </nav>
      <section
        className="research-attributions"
        aria-label="Filtered manufacturing attributions"
      >
        <div>
          <Building2 size={20} />
          <h3>Manufacturing attributions</h3>
          <span>Workspace filters applied</span>
        </div>
        {claims.length ? (
          claims.map((claim) => (
            <button key={claim.id} onClick={() => onClaim(claim.id)}>
              <span>
                {names.get(claim.supplier_id || '') ||
                  'Organization unresolved'}
                <small>
                  {claim.role} · {claim.observed_at}
                </small>
              </span>
              <Status value={claim.context_status || claim.status} />
              <ArrowRight size={16} />
            </button>
          ))
        ) : (
          <p>
            No manufacturing attributions match the current filters. The
            historical dossier remains available across all cited dates.
          </p>
        )}
      </section>
      {sections.map((section) => (
        <section
          key={section.id}
          id={`${prefix}-${section.id}`}
          className={`research-section research-section-${section.id}`}
          aria-labelledby={`${prefix}-${section.id}-title`}
        >
          <div className="research-section-heading">
            <h3 id={`${prefix}-${section.id}-title`}>{section.title}</h3>
            <span>{section.entries.length} records</span>
          </div>
          {section.id === 'people' && (
            <p className="research-section-note">
              Names describe historical public roles. They do not establish
              current officeholding or individual responsibility for engineering
              work.
            </p>
          )}
          <div className="research-entry-grid">
            {section.entries.map(renderEntry)}
          </div>
        </section>
      ))}
      <section
        id={`${prefix}-sources`}
        className="research-section research-sources"
        aria-labelledby={`${prefix}-sources-title`}
      >
        <div className="research-section-heading">
          <h3 id={`${prefix}-sources-title`}>Sources and access notes</h3>
          <span>{dossier.sources.length} references</span>
        </div>
        <p className="research-section-note">
          Government statements are attributed to their issuing institution.
          Exhibition reporting, visual analysis and later investigations
          establish different kinds of evidence. Publication and observation
          dates are retained separately.
        </p>
        <ol>
          {dossier.sources.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title}
                <ArrowUpRight size={15} />
              </a>
              <p>
                {source.publisher} ·{' '}
                {source.published || 'Publication date unavailable'} · retrieved{' '}
                {source.retrieved}
              </p>
              <details>
                <summary>Source notes and cited passages</summary>
                <p>
                  {source.license}. {source.reuse}
                </p>
                <ul>
                  {[
                    ...dossier.systems,
                    ...sections.flatMap((section) => section.entries),
                  ].flatMap((entry) =>
                    entry.evidence
                      .filter((ref) => ref.source_id === source.id)
                      .map((ref) => (
                        <li key={`${entry.id}-${source.id}`}>
                          <strong>{entry.title}:</strong> {ref.reference}
                        </li>
                      )),
                  )}
                </ul>
              </details>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
