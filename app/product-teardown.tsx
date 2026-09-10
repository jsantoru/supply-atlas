import { useId, useMemo, useState, type CSSProperties } from 'react';
import {
  ArrowRight,
  Box,
  ChevronRight,
  Cpu,
  Factory,
  Layers3,
  Maximize2,
  RotateCcw,
  Scan,
  ShieldCheck,
} from 'lucide-react';
import type { Atlas, Claim, Entity } from './types';
import { Status } from './controls';
import './teardown.css';
import ResearchStudio from './research-studio';

type Props = {
  product: Entity;
  data: Atlas;
  claims: Claim[];
  onEntity: (id: string) => void;
  onClaim: (id: string) => void;
  onProduct: (id: string) => void;
  onMap: (id: string) => void;
};
type Crop = { x: number; y: number; w: number; h: number };
const images: Record<string, string> = {
  pi5: '/products/pi5.png',
  pi4: '/products/pi4.png',
  pico: '/products/pico.png',
  pi500: '/products/pi500.png',
  pi400: '/products/pi400.png',
  'mac-pro-2019': '/products/mac-pro-2019.png',
  'galaxy-s9': '/products/galaxy-s9.png',
  pico2: '/products/pico2.png',
  'pico-w': '/products/pico-w.png',
};
const crops: Record<string, Record<string, Crop>> = {
  pi5: {
    bcm2712: { x: 30.5, y: 31, w: 15.5, h: 24 },
    rp1: { x: 57, y: 44, w: 7, h: 12 },
    da9091: { x: 21.8, y: 39, w: 3.5, h: 6 },
    cyw43455: { x: 23, y: 63, w: 5, h: 8 },
    bcm54213: { x: 64, y: 64, w: 4, h: 6 },
  },
  pi4: {
    bcm2711: { x: 31.1, y: 30, w: 14.8, h: 22.8 },
    vl805: { x: 62, y: 42.5, w: 8, h: 13 },
    cyw43455: { x: 17, y: 24.5, w: 7.5, h: 13 },
    bcm54213: { x: 62.5, y: 24.5, w: 5, h: 9 },
  },
  pico: { rp2040: { x: 45.5, y: 38.5, w: 12.5, h: 19 } },
  pico2: {
    rp2350: { x: 46, y: 37.5, w: 14, h: 21 },
    w25q32rv: { x: 78, y: 42.5, w: 8, h: 16 },
    'abm8-272-t3': { x: 37.5, y: 54, w: 4.4, h: 9.5 },
  },
  'pico-w': {
    rp2040: { x: 36.5, y: 38, w: 13.5, h: 20 },
    cyw43439: { x: 64.5, y: 33, w: 18.5, h: 30 },
  },
};

export default function ProductTeardown(props: Props) {
  if (props.data.research?.[props.product.id]) {
    return <ResearchStudio key={props.product.id} {...props} />;
  }
  // A new product starts with a fresh, assembled studio; filters keep the current view.
  return <Studio key={props.product.id} {...props} />;
}

function Studio({
  product,
  data,
  claims,
  onEntity,
  onClaim,
  onProduct,
  onMap,
}: Props) {
  const [explosion, setExplosion] = useState(0);
  const [angle, setAngle] = useState(-9);
  const [tilt, setTilt] = useState(true);
  const [selected, setSelected] = useState('');
  const [failedImage, setFailedImage] = useState(false);
  const maskId = useId().replace(/:/g, '');
  const byId = useMemo(
    () => new Map(data.entities.map((e) => [e.id, e])),
    [data.entities],
  );
  const partIds = [
    ...new Set(claims.map((c) => c.part_id).filter((id): id is string => !!id)),
  ];
  const parts = partIds
    .map((id) => byId.get(id))
    .filter((e): e is Entity => !!e);
  const active = parts.find((p) => p.id === selected) || parts[0];
  const partClaims = active
    ? claims.filter((c) => c.part_id === active.id)
    : [];
  const factories = [
    ...new Set(
      claims.map((c) => c.facility_id).filter((id): id is string => !!id),
    ),
  ];
  const siblings = active
    ? data.entities.filter(
        (e) =>
          e.kind === 'product' &&
          e.id !== product.id &&
          data.claims.some(
            (c) => c.product_id === e.id && c.part_id === active.id,
          ),
      )
    : [];
  const asset = images[product.id];
  const sourceCrops = crops[product.id] || {};
  const decomposition = explosion / 100;
  const vars = {
    '--separation': decomposition,
    '--angle': `${angle}deg`,
    '--tilt': tilt ? '27deg' : '0deg',
  } as CSSProperties;
  const selectPart = (id: string) => {
    setSelected(id);
    if (explosion === 0) setExplosion(62);
  };
  return (
    <div className="product-studio">
      <section
        className="studio-canvas"
        aria-label={`${product.name} interactive product illustration`}
        style={vars}
      >
        <div className="studio-topline">
          <span>
            <Box size={17} /> Product studio
          </span>
          <span className="studio-tag">Illustrated cutaway</span>
        </div>
        <div className="studio-intro">
          <p className="studio-eyebrow">From the product to its origins</p>
          <h2>Every part has a story.</h2>
          <p>Separate the layers. Follow the evidence.</p>
        </div>
        <div
          className="studio-view-controls"
          aria-label="Product view controls"
        >
          <button
            title="Toggle angled view"
            aria-label="Toggle angled view"
            aria-pressed={tilt}
            onClick={() => setTilt((v) => !v)}
          >
            <Maximize2 size={18} />
          </button>
          <button
            title="Rotate product"
            aria-label="Rotate product"
            onClick={() => setAngle((v) => (v >= 15 ? -15 : v + 12))}
          >
            <RotateCcw size={18} />
          </button>
          <button
            title="Reset product view"
            aria-label="Reset product view"
            onClick={() => {
              setExplosion(0);
              setAngle(-9);
              setTilt(true);
            }}
          >
            <Scan size={18} />
          </button>
        </div>
        <div
          className={`studio-stage ${asset && !failedImage ? '' : 'studio-schematic'}`}
        >
          <div className="studio-plane">
            {asset && !failedImage ? (
              <>
                <svg
                  className="studio-product-image"
                  viewBox="0 0 1000 667"
                  role="img"
                  aria-label={`AI-generated illustrative rendering of ${product.name}; component layout is approximate`}
                >
                  <defs>
                    <mask
                      id={maskId}
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="1000"
                      height="667"
                    >
                      <rect width="1000" height="667" fill="white" />
                      {parts.map((p) =>
                        sourceCrops[p.id] ? (
                          <rect
                            key={p.id}
                            x={sourceCrops[p.id].x * 10}
                            y={sourceCrops[p.id].y * 6.67}
                            width={sourceCrops[p.id].w * 10}
                            height={sourceCrops[p.id].h * 6.67}
                            fill="black"
                            opacity={decomposition}
                          />
                        ) : null,
                      )}
                    </mask>
                  </defs>
                  <image
                    href={asset}
                    width="1000"
                    height="667"
                    mask={`url(#${maskId})`}
                    onError={() => setFailedImage(true)}
                  />
                </svg>
              </>
            ) : (
              <div className="studio-generic-board">
                <Cpu size={68} />
                <span>{product.name}</span>
                <small>Conceptual component layout</small>
              </div>
            )}
            {parts.map((p, i) => {
              if (p.category_id === 'assembly') return null;
              const crop = sourceCrops[p.id];
              const x = crop ? crop.x + crop.w / 2 : 25 + (i % 3) * 24;
              const y = crop
                ? crop.y + crop.h / 2
                : 39 + Math.floor(i / 3) * 22;
              const chipStyle = {
                left: `${x}%`,
                top: `${y}%`,
                '--lift': `${65 + (i % 3) * 55}px`,
                '--drift': `${(i % 2 === 0 ? -1 : 1) * (15 + i * 9)}px`,
                ...(crop
                  ? {
                      width: `${crop.w}%`,
                      height: `${crop.h}%`,
                      backgroundImage: `url(${asset})`,
                      backgroundSize: `${10000 / crop.w}% ${10000 / crop.h}%`,
                      backgroundPosition: `${(crop.x / (100 - crop.w)) * 100}% ${(crop.y / (100 - crop.h)) * 100}%`,
                    }
                  : {}),
              } as CSSProperties;
              return (
                <button
                  key={p.id}
                  className={`studio-chip ${crop ? 'studio-chip-crop' : 'studio-chip-concept'} ${active?.id === p.id && selected ? 'is-selected' : ''}`}
                  style={chipStyle}
                  onClick={() => selectPart(p.id)}
                  aria-label={`Inspect ${p.name}`}
                  aria-pressed={active?.id === p.id && !!selected}
                >
                  {!crop && <Cpu size={28} />}
                  <span className="studio-chip-index">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="studio-chip-label">
                    {p.name}
                    <ChevronRight size={12} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="studio-controls">
          <button
            className="studio-explode"
            onClick={() => setExplosion((v) => (v > 0 ? 0 : 85))}
          >
            <Layers3 size={18} />
            {explosion > 0 ? 'Reassemble product' : 'Explode components'}
          </button>
          <label className="studio-slider">
            <span>
              Layer separation <output>{explosion}%</output>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={explosion}
              aria-label="Layer separation"
              onChange={(e) => setExplosion(Number(e.target.value))}
            />
          </label>
        </div>
        <p className="studio-disclosure">
          AI-generated product illustration · approximate layout and packages ·
          documented partial breakdown, not a repair guide or complete bill of
          materials.
        </p>
      </section>
      <aside
        className="studio-inspector"
        aria-label="Selected component sourcing"
      >
        <div className="studio-inspector-title">
          <Cpu size={19} />
          <h3>Inside this product</h3>
          <span>{parts.length}</span>
        </div>
        {parts.length ? (
          <>
            <div
              className="studio-part-list"
              aria-label="Documented components"
            >
              {parts.map((p, i) => (
                <button
                  key={p.id}
                  className={active?.id === p.id ? 'active' : ''}
                  aria-pressed={active?.id === p.id}
                  onClick={() => selectPart(p.id)}
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{p.name}</strong>
                    <small>
                      {byId.get(p.category_id || '')?.name || 'Documented part'}
                    </small>
                  </div>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
            {active && (
              <div className="studio-part-detail">
                <p className="studio-section-label">Selected component</p>
                <button
                  className="studio-part-heading"
                  onClick={() => onEntity(active.id)}
                >
                  {active.name}
                  <ArrowRight size={18} />
                </button>
                <p>{active.description}</p>
                {partClaims.map((c) => (
                  <button
                    className="studio-source-row"
                    key={c.id}
                    onClick={() => onClaim(c.id)}
                  >
                    <span>
                      <strong>
                        {byId.get(c.supplier_id || '')?.name ||
                          'Supplier unknown'}
                      </strong>
                      <small>
                        {c.role} {c.product_id ? '' : '· part-level evidence'}
                      </small>
                    </span>
                    <Status
                      value={
                        c.context_status ||
                        (!c.product_id && c.status === 'direct'
                          ? 'inferred'
                          : c.status)
                      }
                    />
                  </button>
                ))}
                <p className="studio-gap">
                  <ShieldCheck size={16} />
                  {partClaims.some((c) => c.facility_id)
                    ? 'Manufacturing location documented for the scoped claim.'
                    : 'Manufacturing facility not identified in this evidence.'}
                </p>
                {!!siblings.length && (
                  <div className="studio-shared">
                    <p className="studio-section-label">
                      Same part · all dates and variants
                    </p>
                    {siblings.map((p) => (
                      <button key={p.id} onClick={() => onProduct(p.id)}>
                        {p.name}
                        <ArrowRight size={15} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="studio-empty">
            No documented parts match these filters. Reset the product filters
            to explore available evidence.
          </p>
        )}
      </aside>
      <section
        className="studio-origins"
        aria-label="Documented manufacturing locations"
      >
        <div>
          <p className="studio-section-label">
            Follow the physical supply chain
          </p>
          <h3>
            {factories.length
              ? 'From components to the factory floor.'
              : 'The next question is where.'}
          </h3>
          <p>
            {factories.length
              ? 'Product-specific evidence and inferred part-level allocations are distinguished below.'
              : 'No manufacturing facility is documented for this selection. A supplier name alone cannot locate production.'}
          </p>
        </div>
        <div className="studio-factory-cards">
          {factories.length ? (
            factories.map((id) => {
              const f = byId.get(id);
              const evidence =
                claims.find(
                  (c) => c.facility_id === id && c.product_id === product.id,
                ) || claims.find((c) => c.facility_id === id);
              return (
                f && (
                  <article key={id}>
                    <Factory size={26} />
                    {evidence && (
                      <Status
                        value={
                          evidence.context_status ||
                          (!evidence.product_id && evidence.status === 'direct'
                            ? 'inferred'
                            : evidence.status)
                        }
                      />
                    )}
                    <p>
                      {byId.get(f.region_id || '')?.name || 'Region unknown'}
                    </p>
                    <h4>{f.name}</h4>
                    <span>
                      {evidence?.role} · {f.precision} location
                    </span>
                    <button onClick={() => onMap(id)}>
                      Explore this factory <ArrowRight size={16} />
                    </button>
                    {evidence && (
                      <button
                        className="studio-evidence-link"
                        onClick={() => onClaim(evidence.id)}
                      >
                        Inspect manufacturing evidence
                      </button>
                    )}
                  </article>
                )
              );
            })
          ) : (
            <div className="studio-unknown-factory">
              <Factory size={30} />
              <strong>Location remains unknown</strong>
              <span>Missing coverage is visible. No facility is assumed.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
