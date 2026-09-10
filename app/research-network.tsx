import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Network as NetworkIcon } from 'lucide-react';
import { api, type Source } from './types';
import { ErrorState } from './controls';
import './research-network.css';

type Node = { id: string; label: string; kind: string };
type Relation = {
  id: string;
  title: string;
  text: string;
  basis: string;
  date: string;
  source_node: string;
  target_node: string;
  relation_kind: 'industrial' | 'evaluation' | 'program';
  evidence: { source_id: string; reference: string }[];
};
type Profile = {
  network: { nodes: Node[]; edges: Relation[] } | null;
  sources: Source[];
};
const kindLabels = {
  industrial: 'Industrial attribution',
  evaluation: 'Evaluation',
  program: 'Program context',
};

export default function ResearchNetwork({ product }: { product: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setProfile(null);
    setError('');
    api<Profile>(`/api/research/${product}`, { signal: controller.signal })
      .then(setProfile)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      });
    return () => controller.abort();
  }, [product, retry]);
  if (error)
    return <ErrorState error={error} retry={() => setRetry((v) => v + 1)} />;
  if (!profile)
    return <p role="status">Loading cited program relationships…</p>;
  if (!profile.network) return null;
  return (
    <ProgramNetwork
      key={product}
      network={profile.network}
      sources={profile.sources}
    />
  );
}

function ProgramNetwork({
  network,
  sources,
}: {
  network: NonNullable<Profile['network']>;
  sources: Source[];
}) {
  const [nodeFilter, setNodeFilter] = useState('all');
  const [selected, setSelected] = useState(network.edges[0].id);
  const current = network.edges.find((edge) => edge.id === selected)!;
  const names = new Map(network.nodes.map((node) => [node.id, node.label]));
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const product =
    network.nodes.find((node) => node.kind === 'product') || network.nodes[0];
  const outerNodes = network.nodes.filter((node) => node.id !== product.id);
  const rows = Math.ceil(outerNodes.length / 2);
  const canvasHeight = Math.max(390, rows * 125 + 35);
  const positions = new Map<string, { x: number; y: number }>([
    [product.id, { x: 500, y: canvasHeight / 2 }],
  ]);
  outerNodes.forEach((node, index) => {
    const column = index < rows ? 0 : 1;
    const row = index % rows;
    positions.set(node.id, { x: column ? 840 : 160, y: 80 + row * 125 });
  });
  const filtered = network.edges.filter(
    (edge) =>
      nodeFilter === 'all' ||
      edge.source_node === nodeFilter ||
      edge.target_node === nodeFilter,
  );
  const chooseNode = (id: string) => {
    setNodeFilter(id);
    const related = network.edges.find(
      (edge) => edge.source_node === id || edge.target_node === id,
    );
    if (related) setSelected(related.id);
  };
  return (
    <section
      className="program-network"
      aria-label="Cited industrial and program network"
    >
      <header className="program-network-heading">
        <div>
          <p>
            <NetworkIcon size={16} /> Public program record
          </p>
          <h2>Who is connected, and how.</h2>
        </div>
        <span>{network.edges.length} cited relationships</span>
      </header>
      <p className="program-network-scope">
        The manufacturing graph above contains supplier claims. This separate
        view adds dated sponsorship, evaluation and program relationships.
        Program participants are not component suppliers, and these links do not
        drive disruption calculations. Workspace filters apply to the
        manufacturing graph; this record spans all cited dates.
      </p>
      <div className="program-network-legend" aria-label="Relationship types">
        {Object.entries(kindLabels).map(([kind, label]) => (
          <span key={kind} className={`program-kind-${kind}`}>
            <i />
            {label}
          </span>
        ))}
      </div>
      <div
        className="program-network-scroll"
        role="region"
        aria-label="Program relationship diagram"
      >
        <div
          className="program-network-canvas"
          style={{ height: canvasHeight }}
        >
          <svg
            viewBox={`0 0 1000 ${canvasHeight}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="program-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0 0L8 4L0 8Z" fill="currentColor" />
              </marker>
            </defs>
            {network.edges.map((edge) => {
              const from = positions.get(edge.source_node)!;
              const to = positions.get(edge.target_node)!;
              const horizontal = Math.abs(to.x - from.x) > 50;
              const direction = to.x > from.x ? 1 : -1;
              const start = {
                x: from.x + (horizontal ? direction * 108 : 0),
                y: from.y + (horizontal ? 0 : Math.sign(to.y - from.y) * 38),
              };
              const end = {
                x: to.x - (horizontal ? direction * 112 : 0),
                y: to.y - (horizontal ? 0 : Math.sign(to.y - from.y) * 42),
              };
              return (
                <path
                  key={edge.id}
                  className={`program-edge program-kind-${edge.relation_kind} ${edge.id === selected ? 'is-selected' : ''}`}
                  d={`M${start.x},${start.y} C${(start.x + end.x) / 2},${start.y} ${(start.x + end.x) / 2},${end.y} ${end.x},${end.y}`}
                  markerEnd="url(#program-arrow)"
                />
              );
            })}
          </svg>
          {network.nodes.map((node) => {
            const point = positions.get(node.id)!;
            const connected =
              node.id === current.source_node ||
              node.id === current.target_node;
            return (
              <button
                key={node.id}
                className={`program-node ${connected ? 'is-connected' : ''} ${node.kind === 'product' ? 'is-product' : ''}`}
                style={{ left: `${point.x / 10}%`, top: point.y }}
                onClick={() => chooseNode(node.id)}
                aria-pressed={nodeFilter === node.id}
                aria-label={`Show relationships for ${node.label}`}
              >
                <span>{node.kind.replace('-', ' ')}</span>
                <strong>{node.label}</strong>
              </button>
            );
          })}
        </div>
      </div>
      <div className="program-network-filter">
        <label htmlFor="program-node-filter">Show relationships</label>
        <select
          id="program-node-filter"
          value={nodeFilter}
          onChange={(event) =>
            event.target.value === 'all'
              ? setNodeFilter('all')
              : chooseNode(event.target.value)
          }
        >
          <option value="all">All organizations and programs</option>
          {network.nodes.map((node) => (
            <option value={node.id} key={node.id}>
              {node.label}
            </option>
          ))}
        </select>
        {nodeFilter !== 'all' && (
          <button onClick={() => setNodeFilter('all')}>Show all</button>
        )}
      </div>
      <div className="program-network-details">
        <div
          className="program-relation-list"
          role="group"
          aria-label="Cited relationships"
        >
          {filtered.map((edge) => (
            <button
              key={edge.id}
              onClick={() => setSelected(edge.id)}
              aria-pressed={selected === edge.id}
              className={`program-relation program-kind-${edge.relation_kind}`}
            >
              <span>{kindLabels[edge.relation_kind]}</span>
              <strong>
                {names.get(edge.source_node)} <ArrowRight size={14} />{' '}
                {names.get(edge.target_node)}
              </strong>
              <small>{edge.title}</small>
            </button>
          ))}
        </div>
        <aside
          className="program-relation-evidence"
          aria-label="Selected relationship evidence"
        >
          <p
            className={`program-relation-category program-kind-${current.relation_kind}`}
          >
            {kindLabels[current.relation_kind]}
          </p>
          <h3>{current.title}</h3>
          <p className="program-relation-date">
            {current.date} ·{' '}
            {current.basis === 'observed'
              ? 'Reported observation'
              : current.basis === 'attributed'
                ? 'Attributed source statement'
                : current.basis === 'unresolved'
                  ? 'Unresolved'
                  : 'Historical context'}
          </p>
          <p>{current.text}</p>
          <h4>
            <BookOpen size={16} /> Evidence
          </h4>
          <ul>
            {current.evidence.map((reference) => {
              const source = sourceMap.get(reference.source_id);
              return (
                <li key={`${reference.source_id}-${reference.reference}`}>
                  {source ? (
                    <>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title}
                      </a>
                      <span>
                        {source.publisher} ·{' '}
                        {source.published || 'Publication date unavailable'}
                      </span>
                      <small>{reference.reference}</small>
                    </>
                  ) : (
                    <span>Reference unavailable: {reference.source_id}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </section>
  );
}
