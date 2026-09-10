import { useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import type { Network } from './types';
import { EntityIcon, Empty } from './controls';

export default function NetworkView({
  network,
  selected,
  onEntity,
  onClaim,
}: {
  network: Network;
  selected: string;
  onEntity: (id: string) => void;
  onClaim: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [highlight, setHighlight] = useState('');
  const parts = network.nodes.filter((n) => n.kind === 'part');
  const inputs = network.nodes.filter(
    (n) => !['part', 'product'].includes(n.kind),
  );
  const edges = network.edges.filter((e) => !collapsed.includes(e.target));
  const activeIds = new Set(edges.flatMap((e) => [e.source, e.target]));
  const nodes = network.nodes.filter(
    (n) => n.kind === 'product' || n.kind === 'part' || activeIds.has(n.id),
  );
  const height = Math.max(480, Math.max(parts.length, inputs.length) * 78 + 80);
  const positions = Object.fromEntries(
    nodes.map((n) => {
      const col = n.kind === 'product' ? 2 : n.kind === 'part' ? 1 : 0;
      const group =
        col === 2
          ? nodes.filter((x) => x.kind === 'product')
          : col === 1
            ? parts
            : inputs;
      return [
        n.id,
        {
          x: col === 2 ? 650 : col === 1 ? 355 : 35,
          y:
            45 +
            ((height - 100) * (group.indexOf(n) + 0.5)) /
              Math.max(group.length, 1),
        },
      ];
    }),
  );
  const highlighted = new Set(
    network.edges
      .filter((e) => e.source === highlight || e.target === highlight)
      .flatMap((e) => [e.source, e.target]),
  );
  if (!network.edges.length) return <Empty />;
  return (
    <div className="graph-wrap">
      <div className="graph-key">
        <span>
          <i className="dot navy" />
          Supplier / facility
        </span>
        <span>
          <i className="dot blue" />
          Specific part
        </span>
        <span>
          <i className="dot orange" />
          Product
        </span>
      </div>
      <div className="graph-scroll">
        <div
          className="graph-canvas"
          style={{ width: 900 * zoom, height: height * zoom }}
        >
          <div
            style={{
              width: 900,
              height,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              position: 'relative',
            }}
          >
            <div className="lane-label" style={{ left: 35 }}>
              Supply & manufacturing
            </div>
            <div className="lane-label" style={{ left: 355 }}>
              Components
            </div>
            <div className="lane-label" style={{ left: 650 }}>
              Product
            </div>
            <svg
              width="900"
              height={height}
              className="graph-lines"
              aria-label="Directional supply relationships"
            >
              <defs>
                <marker
                  id="arrow"
                  markerWidth="7"
                  markerHeight="7"
                  refX="7"
                  refY="3.5"
                  orient="auto"
                >
                  <path d="M0 0 L7 3.5 L0 7" fill="#7c94a5" />
                </marker>
                <marker
                  id="arrow-active"
                  markerWidth="7"
                  markerHeight="7"
                  refX="7"
                  refY="3.5"
                  orient="auto"
                >
                  <path d="M0 0 L7 3.5 L0 7" fill="#d64000" />
                </marker>
              </defs>
              {edges.map((e) => {
                const a = positions[e.source],
                  b = positions[e.target];
                if (!a || !b) return null;
                const active =
                  highlight &&
                  (e.source === highlight || e.target === highlight);
                return (
                  <g key={e.id}>
                    <title>
                      {e.label} ·{' '}
                      {e.upstream ? 'Part-level inference' : e.status} ·{' '}
                      {e.claim_id}
                    </title>
                    <path
                      d={`M${a.x + 200} ${a.y + 30} C${a.x + 250} ${a.y + 30},${b.x - 50} ${b.y + 30},${b.x} ${b.y + 30}`}
                      stroke={active ? '#D64000' : '#aabcc9'}
                      strokeWidth={active ? 2.5 : 1.5}
                      strokeDasharray={
                        e.upstream || e.status !== 'direct' ? '5 5' : undefined
                      }
                      fill="none"
                      markerEnd={active ? 'url(#arrow-active)' : 'url(#arrow)'}
                    />
                    <path
                      d={`M${a.x + 200} ${a.y + 30} C${a.x + 250} ${a.y + 30},${b.x - 50} ${b.y + 30},${b.x} ${b.y + 30}`}
                      stroke="transparent"
                      strokeWidth="16"
                      fill="none"
                      className="edge-hit"
                      onClick={() => onClaim(e.claim_id)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Evidence: ${e.label}, ${e.claim_id}`}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                          ev.preventDefault();
                          onClaim(e.claim_id);
                        }
                      }}
                    />
                  </g>
                );
              })}
            </svg>
            {nodes.map((n) => {
              const pos = positions[n.id];
              return (
                <div
                  key={n.id}
                  className={`graph-node ${n.kind} ${selected === n.id ? 'selected' : ''} ${highlighted.has(n.id) || highlight === n.id ? 'highlighted' : ''}`}
                  style={{ left: pos.x, top: pos.y }}
                  onMouseEnter={() => setHighlight(n.id)}
                  onMouseLeave={() => setHighlight('')}
                >
                  <button
                    className="node-main"
                    onFocus={() => setHighlight(n.id)}
                    onBlur={() => setHighlight('')}
                    onClick={() => onEntity(n.id)}
                  >
                    <EntityIcon kind={n.kind} />
                    <span>
                      <strong>{n.name}</strong>
                      <small>
                        {n.kind === 'part'
                          ? 'Specific part'
                          : n.kind === 'facility'
                            ? 'Board assembly · Wales'
                            : n.kind === 'product'
                              ? 'Documented partial breakdown'
                              : 'Documented supplier'}
                      </small>
                    </span>
                  </button>
                  {n.kind === 'part' && (
                    <button
                      className="node-collapse"
                      aria-label={`${collapsed.includes(n.id) ? 'Expand' : 'Collapse'} suppliers for ${n.name}`}
                      onClick={() =>
                        setCollapsed((v) =>
                          v.includes(n.id)
                            ? v.filter((x) => x !== n.id)
                            : [...v, n.id],
                        )
                      }
                    >
                      {collapsed.includes(n.id) ? (
                        <Plus size={12} />
                      ) : (
                        <Minus size={12} />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="graph-footer">
        <span>
          Arrows follow supply → product · Dashed lines indicate part-level or
          uncertain links
        </span>
        <div className="zoom-controls">
          <button
            aria-label="Zoom out"
            onClick={() => setZoom((v) => Math.max(0.6, v - 0.1))}
          >
            <Minus size={16} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            aria-label="Zoom in"
            onClick={() => setZoom((v) => Math.min(1.5, v + 0.1))}
          >
            <Plus size={16} />
          </button>
          <button
            aria-label="Reset graph"
            onClick={() => {
              setZoom(1);
              setCollapsed([]);
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
