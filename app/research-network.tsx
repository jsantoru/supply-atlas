import { useEffect, useId, useState } from 'react';
import {
  ArrowRight,
  ArrowLeftRight,
  BookOpen,
  GitBranch,
  Network as NetworkIcon,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
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
const basisLabels: Record<string, string> = {
  observed: 'Reported observation',
  attributed: 'Attributed source statement',
  unresolved: 'Unresolved',
  context: 'Historical context',
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
  if (!profile.network)
    return (
      <p>No documented organization network is available for this product.</p>
    );
  return (
    <ProgramNetwork
      key={product}
      network={profile.network}
      sources={profile.sources}
    />
  );
}

function connectedPath(edges: Relation[], start: string, end: string) {
  const queue = [{ nodes: [start], edges: [] as string[] }];
  const visited = new Set([start]);
  for (let index = 0; index < queue.length; index++) {
    const path = queue[index];
    const node = path.nodes.at(-1)!;
    if (node === end) return path;
    for (const edge of edges) {
      const neighbor =
        edge.source_node === node
          ? edge.target_node
          : edge.target_node === node
            ? edge.source_node
            : null;
      if (!neighbor || visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push({
        nodes: [...path.nodes, neighbor],
        edges: [...path.edges, edge.id],
      });
    }
  }
  return null;
}

function ProgramNetwork({
  network,
  sources,
}: {
  network: NonNullable<Profile['network']>;
  sources: Source[];
}) {
  const [nodeFilter, setNodeFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(network.edges[0]?.id || '');
  const [zoom, setZoom] = useState(1);
  const filterId = useId();
  const markerId = useId().replace(/:/g, '');
  const names = new Map(network.nodes.map((node) => [node.id, node.label]));
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const product =
    network.nodes.find((node) => node.kind === 'product') || network.nodes[0];
  const distances = new Map(
    network.nodes.map((node) => [
      node.id,
      connectedPath(network.edges, node.id, product.id)?.edges.length ?? 0,
    ]),
  );
  const maxDistance = Math.max(1, ...distances.values());
  const lanes = Array.from(
    { length: Math.min(maxDistance, 3) + 1 },
    (_, index) => Math.min(maxDistance, 3) - index,
  );
  const nodesByLane = lanes.map((distance) =>
    network.nodes
      .filter((node) => Math.min(distances.get(node.id)!, 3) === distance)
      .sort(
        (a, b) =>
          a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label),
      ),
  );
  const rowCount = Math.max(...nodesByLane.map((nodes) => nodes.length));
  const canvasHeight = Math.max(440, rowCount * 105 + 125);
  const canvasWidth = lanes.length * 320 + 40;
  const positions = new Map<string, { x: number; y: number }>();
  nodesByLane.forEach((nodes, lane) =>
    nodes.forEach((node, row) => {
      positions.set(node.id, {
        x: 180 + lane * 320,
        y: 110 + (rowCount - nodes.length) * 52.5 + row * 105,
      });
    }),
  );
  const categoryEdges = network.edges.filter(
    (edge) => category === 'all' || edge.relation_kind === category,
  );
  const path =
    nodeFilter === 'all'
      ? null
      : connectedPath(categoryEdges, nodeFilter, product.id);
  const pathIds = new Set(path?.edges || []);
  const filtered = categoryEdges.filter(
    (edge) =>
      nodeFilter === 'all' ||
      edge.source_node === nodeFilter ||
      edge.target_node === nodeFilter ||
      pathIds.has(edge.id),
  );
  const current = filtered.find((edge) => edge.id === selected) || filtered[0];
  const activeNodes = new Set(
    filtered.flatMap((edge) => [edge.source_node, edge.target_node]),
  );
  const activeEdges = new Set(filtered.map((edge) => edge.id));
  const sourceCount = new Set(
    network.edges.flatMap((edge) =>
      edge.evidence.map((reference) => reference.source_id),
    ),
  ).size;
  const chooseNode = (id: string) => {
    setNodeFilter(id);
    const related = categoryEdges.find(
      (edge) => edge.source_node === id || edge.target_node === id,
    );
    if (related) setSelected(related.id);
  };
  const reset = () => {
    setNodeFilter('all');
    setCategory('all');
    setSelected(network.edges[0]?.id || '');
    setZoom(1);
  };
  return (
    <section
      className="program-network"
      aria-label="Cited industrial and program network"
    >
      <header className="program-network-heading">
        <div>
          <p>
            <NetworkIcon size={16} /> Documented organization network
          </p>
          <h2>The organizations behind {product.label}.</h2>
        </div>
        <div
          className="program-network-stats"
          aria-label="Documented network coverage"
        >
          <span>
            <strong>{network.nodes.length}</strong> connected entities
          </span>
          <span>
            <strong>{network.edges.length}</strong> cited relationships
          </span>
          <span>
            <strong>{sourceCount}</strong> supporting sources
          </span>
        </div>
      </header>
      <p className="program-network-scope">
        Dated company, funding, evaluation and program relationships. Supplier
        claims and disruption calculations remain separate; this record spans
        all cited dates.
      </p>
      <div className="program-network-tools">
        <div
          className="program-category-filters"
          role="group"
          aria-label="Relationship category"
        >
          <button
            aria-pressed={category === 'all'}
            onClick={() => setCategory('all')}
          >
            All relationships <span>{network.edges.length}</span>
          </button>
          {Object.entries(kindLabels).map(([kind, label]) => (
            <button
              key={kind}
              className={`program-kind-${kind}`}
              aria-pressed={category === kind}
              onClick={() => setCategory(kind)}
            >
              <i />
              {label}
              <span>
                {
                  network.edges.filter((edge) => edge.relation_kind === kind)
                    .length
                }
              </span>
            </button>
          ))}
        </div>
        <div className="program-network-filter">
          <label className="sr-only" htmlFor={filterId}>
            Focus organization or program
          </label>
          <select
            id={filterId}
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
          {(nodeFilter !== 'all' || category !== 'all') && (
            <button onClick={reset}>Clear network filters</button>
          )}
        </div>
      </div>
      <div className="program-diagram-toolbar">
        <p role="status">
          <strong>{filtered.length}</strong> of {network.edges.length}{' '}
          relationships shown
          {nodeFilter !== 'all' && <> · Focus: {names.get(nodeFilter)}</>}
        </p>
        <div
          className="program-zoom"
          role="group"
          aria-label="Network view controls"
        >
          <button
            aria-label="Zoom out network"
            title="Zoom out"
            disabled={zoom <= 0.75}
            onClick={() => setZoom((value) => Math.max(0.75, value - 0.125))}
          >
            <ZoomOut size={16} />
          </button>
          <output>{Math.round(zoom * 100)}%</output>
          <button
            aria-label="Zoom in network"
            title="Zoom in"
            disabled={zoom >= 1.25}
            onClick={() => setZoom((value) => Math.min(1.25, value + 0.125))}
          >
            <ZoomIn size={16} />
          </button>
          <button
            aria-label="Reset network view"
            title="Reset filters and zoom"
            onClick={reset}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <div
        className="program-network-scroll"
        role="region"
        aria-label="Program relationship diagram"
      >
        <div
          className="program-scaled-canvas"
          style={{ width: canvasWidth * zoom, height: canvasHeight * zoom }}
        >
          <div
            className="program-network-canvas"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              transform: `scale(${zoom})`,
            }}
          >
            {lanes.map((distance, lane) => (
              <div
                key={distance}
                className="program-network-lane"
                style={{ left: 30 + lane * 320, width: 300 }}
              >
                <span>{String(lane + 1).padStart(2, '0')}</span>
                <strong>
                  {distance === 0
                    ? 'Aircraft'
                    : distance === 1
                      ? 'Directly documented participants'
                      : 'Institutions & enabling programs'}
                </strong>
                <small>
                  {distance === 0
                    ? 'Product context'
                    : `${distance === 3 ? '3+' : distance} context links from product`}
                </small>
              </div>
            ))}
            <svg
              viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
              aria-hidden="true"
            >
              <defs>
                <marker
                  id={markerId}
                  markerWidth="7"
                  markerHeight="7"
                  refX="6"
                  refY="3.5"
                  orient="auto"
                >
                  <path d="M0 0L7 3.5L0 7Z" fill="context-stroke" />
                </marker>
              </defs>
              {[...network.edges]
                .sort(
                  (a, b) =>
                    Number(a.id === current?.id) - Number(b.id === current?.id),
                )
                .map((edge) => {
                  const index = network.edges.indexOf(edge);
                  const from = positions.get(edge.source_node)!;
                  const to = positions.get(edge.target_node)!;
                  const direction = Math.sign(to.x - from.x);
                  let d: string;
                  if (direction) {
                    const parallel = network.edges.filter(
                      (candidate) =>
                        candidate.source_node === edge.source_node &&
                        candidate.target_node === edge.target_node,
                    );
                    const offset =
                      (parallel.indexOf(edge) - (parallel.length - 1) / 2) * 20;
                    const start = from.x + direction * 110;
                    const end = to.x - direction * 116;
                    const middle = (start + end) / 2;
                    d = `M${start},${from.y + offset} C${middle},${from.y + offset} ${middle},${to.y + offset} ${end},${to.y + offset}`;
                  } else {
                    const route = from.x - 145 - (index % 3) * 9;
                    d = `M${from.x - 110},${from.y} C${route},${from.y} ${route},${to.y} ${to.x - 115},${to.y}`;
                  }
                  return (
                    <path
                      key={edge.id}
                      data-edge-id={edge.id}
                      data-active={activeEdges.has(edge.id)}
                      className={`program-edge program-kind-${edge.relation_kind} ${edge.id === current?.id ? 'is-selected' : ''} ${pathIds.has(edge.id) ? 'is-path' : ''} ${!activeEdges.has(edge.id) ? 'is-dimmed' : ''}`}
                      d={d}
                      markerEnd={`url(#${markerId})`}
                      onClick={() =>
                        activeEdges.has(edge.id) && setSelected(edge.id)
                      }
                    />
                  );
                })}
            </svg>
            {network.nodes.map((node) => {
              const point = positions.get(node.id)!;
              const connected =
                node.id === current?.source_node ||
                node.id === current?.target_node;
              return (
                <button
                  key={node.id}
                  className={`program-node ${connected ? 'is-connected' : ''} ${node.kind === 'product' ? 'is-product' : ''} ${!activeNodes.has(node.id) ? 'is-dimmed' : ''}`}
                  style={{ left: point.x, top: point.y }}
                  onClick={() => chooseNode(node.id)}
                  aria-pressed={nodeFilter === node.id}
                  aria-label={`Show relationships for ${node.label}`}
                >
                  <span>{node.kind.replaceAll('-', ' ')}</span>
                  <strong>{node.label}</strong>
                  <small>
                    {
                      network.edges.filter(
                        (edge) =>
                          edge.source_node === node.id ||
                          edge.target_node === node.id,
                      ).length
                    }{' '}
                    documented links
                  </small>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <p className="program-diagram-help">
        Select a node or a relationship below. Arrows retain each source’s
        stated relationship. Scroll the diagram horizontally on smaller screens,
        or use the zoom controls.
      </p>
      {nodeFilter !== 'all' && (
        <section
          className="program-context-path"
          aria-label="Connected context path"
        >
          <div>
            <GitBranch size={17} />
            <h3>Connected context path</h3>
          </div>
          {path && path.edges.length ? (
            <div className="program-path-steps">
              {path.nodes.map((node, index) => (
                <span key={node}>
                  <button onClick={() => chooseNode(node)}>
                    {names.get(node)}
                  </button>
                  {path.edges[index] && (
                    <button
                      className="program-path-link"
                      aria-label={`Inspect path link: ${network.edges.find((edge) => edge.id === path.edges[index])!.title}`}
                      onClick={() => setSelected(path.edges[index])}
                    >
                      <ArrowLeftRight size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p>
              {nodeFilter === product.id
                ? 'The product is selected. Choose an organization to explore its connected context.'
                : 'No path to the product is documented within this category. Other directly related records may still appear below.'}
            </p>
          )}
          <small>
            This is a navigational path through cited relationships. It does not
            imply an end-to-end supply chain or chain of command.
          </small>
        </section>
      )}
      <div className="program-network-details">
        <div className="program-relation-browser">
          <div className="program-details-heading">
            <h3>Cited relationships</h3>
            <span>{filtered.length} records</span>
          </div>
          <div
            className="program-relation-list"
            role="group"
            aria-label="Cited relationships"
          >
            {filtered.length ? (
              filtered.map((edge) => (
                <button
                  key={edge.id}
                  onClick={() => setSelected(edge.id)}
                  aria-pressed={current?.id === edge.id}
                  className={`program-relation program-kind-${edge.relation_kind}`}
                >
                  <span>
                    {kindLabels[edge.relation_kind]}
                    <small>{edge.date}</small>
                  </span>
                  <strong>
                    {names.get(edge.source_node)} <ArrowRight size={14} />{' '}
                    {names.get(edge.target_node)}
                  </strong>
                  <small>{edge.title}</small>
                </button>
              ))
            ) : (
              <p className="program-empty" role="status">
                No cited relationships match this organization and category.
                Clear the network filters to return to the full record.
              </p>
            )}
          </div>
        </div>
        <aside
          className="program-relation-evidence"
          aria-label="Selected relationship evidence"
          aria-live="polite"
        >
          {current ? (
            <>
              <p
                className={`program-relation-category program-kind-${current.relation_kind}`}
              >
                {kindLabels[current.relation_kind]}
              </p>
              <h3>{current.title}</h3>
              <div className="program-evidence-endpoints">
                <span>{names.get(current.source_node)}</span>
                <ArrowRight size={16} />
                <span>{names.get(current.target_node)}</span>
              </div>
              <p className="program-relation-date">
                {current.date} ·{' '}
                {basisLabels[current.basis] || 'Historical context'}
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
                        <span>
                          Reference unavailable: {reference.source_id}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p>
              Select another organization or relationship category to inspect a
              cited record.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
