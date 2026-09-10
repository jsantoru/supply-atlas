import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import {
  ChevronRight,
  Image as ImageIcon,
  Layers3,
  Maximize2,
  MousePointer2,
  Plane,
  RotateCcw,
  Scan,
} from 'lucide-react';

type SystemTopic = { id: string; title: string };
type Props = {
  name: string;
  subtitle: string;
  systems: SystemTopic[];
  selected: string;
  onSelect: (id: string) => void;
};

const topics: Record<
  string,
  { label: string; x: number; y: number; kind: string }
> = {
  'external-airframe': {
    label: 'Airframe',
    x: 170,
    y: 320,
    kind: 'Exterior form',
  },
  propulsion: { label: 'Propulsion', x: 600, y: 450, kind: 'Exterior form' },
  'guidance-control': {
    label: 'Guidance & control',
    x: 720,
    y: 180,
    kind: 'System topic',
  },
  'payload-role': {
    label: 'Payload role',
    x: 200,
    y: 120,
    kind: 'System topic',
  },
  'ground-support': {
    label: 'Ground support',
    x: 745,
    y: 395,
    kind: 'Program context',
  },
};

export default function LucasStudio({
  name,
  subtitle,
  systems,
  selected,
  onSelect,
}: Props) {
  const [mode, setMode] = useState<'exterior' | 'diagram'>('exterior');
  const [separation, setSeparation] = useState(0);
  const [angle, setAngle] = useState(0);
  const [tilt, setTilt] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const previousSelection = useRef(selected);
  useEffect(() => {
    if (previousSelection.current !== selected) setMode('diagram');
    previousSelection.current = selected;
  }, [selected]);
  const figureId = useId();
  const gradientId = useId().replace(/:/g, '');
  const spread = separation / 100;
  const exteriorSelected = selected === 'external-airframe';
  const propulsionSelected = selected === 'propulsion';
  const selectTopic = (id: string) => {
    onSelect(id);
    setMode('diagram');
  };
  const setSpread = (value: number) => {
    setSeparation(value);
    setMode('diagram');
  };
  const reset = () => {
    previousSelection.current = systems[0].id;
    setSeparation(0);
    setAngle(0);
    setTilt(false);
    setMode(imageFailed ? 'diagram' : 'exterior');
    onSelect(systems[0].id);
  };
  return (
    <section
      className="research-canvas lucas-studio"
      aria-label={`${name} interactive systems illustration`}
    >
      <div className="studio-topline">
        <span>
          <Plane size={17} /> Aircraft studio
        </span>
        <span className="studio-tag">Interactive exterior study</span>
      </div>
      <div className="research-canvas-heading">
        <p>{subtitle}</p>
        <h2>Explore the aircraft.</h2>
        <span>Separate the exterior. Follow the evidence.</span>
      </div>
      <div className="lucas-toolbar">
        <div
          className="lucas-mode-switch"
          role="group"
          aria-label="Illustration mode"
        >
          <button
            aria-pressed={mode === 'exterior'}
            onClick={() => setMode(imageFailed ? 'diagram' : 'exterior')}
            disabled={imageFailed}
          >
            <ImageIcon size={15} /> Exterior illustration
          </button>
          <button
            aria-pressed={mode === 'diagram'}
            onClick={() => setMode('diagram')}
          >
            <Layers3 size={15} /> Interactive diagram
          </button>
        </div>
        <div
          className="studio-view-controls"
          aria-label="Aircraft view controls"
        >
          <button
            title="Toggle angled view"
            aria-label="Toggle angled view"
            aria-pressed={tilt}
            onClick={() => setTilt((v) => !v)}
          >
            <Maximize2 size={17} />
          </button>
          <button
            title="Rotate illustration"
            aria-label="Rotate product"
            onClick={() => setAngle((v) => (v >= 12 ? -12 : v + 12))}
          >
            <RotateCcw size={17} />
          </button>
          <button
            title="Reset view and selection"
            aria-label="Reset product view"
            onClick={reset}
          >
            <Scan size={17} />
          </button>
        </div>
      </div>
      {imageFailed && (
        <p className="lucas-image-notice" role="status">
          Exterior illustration unavailable. The interactive diagram and cited
          system topics remain available.
        </p>
      )}
      <figure
        className={`lucas-figure lucas-mode-${mode}`}
        aria-describedby={figureId}
      >
        <div className="lucas-stage-meta" aria-hidden="true">
          <span>
            {mode === 'exterior'
              ? '01 / EXTERIOR STUDY'
              : '02 / CONCEPTUAL SECTIONS'}
          </span>
          <span>
            {mode === 'exterior'
              ? 'Illustrative rendering'
              : separation
                ? `Separated ${separation}%`
                : 'Assembled exterior'}
          </span>
        </div>
        <div className="lucas-perspective">
          <div
            className="lucas-drawing-plane"
            style={
              {
                '--lucas-angle': `${angle}deg`,
                '--lucas-tilt': tilt ? '18deg' : '0deg',
              } as CSSProperties
            }
          >
            {mode === 'exterior' ? (
              <img
                className="lucas-exterior-image"
                src="/products/lucas.png"
                width="1536"
                height="1024"
                alt={`AI-generated illustrative rendering of ${name}; exterior only, not a measured model`}
                onError={() => {
                  setImageFailed(true);
                  setMode('diagram');
                }}
              />
            ) : (
              <div className="lucas-diagram-sheet" data-separation={separation}>
                <svg
                  viewBox="0 0 900 560"
                  aria-hidden="true"
                  className="lucas-diagram"
                >
                  <defs>
                    <linearGradient
                      id={`${gradientId}-shell`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0" stopColor="#d9e6ea" />
                      <stop offset=".5" stopColor="#8297a7" />
                      <stop offset="1" stopColor="#3e5b72" />
                    </linearGradient>
                    <linearGradient
                      id={`${gradientId}-body`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0" stopColor="#577186" />
                      <stop offset=".38" stopColor="#e0e9e9" />
                      <stop offset=".65" stopColor="#b3c3ca" />
                      <stop offset="1" stopColor="#526e82" />
                    </linearGradient>
                    <pattern
                      id={`${gradientId}-grid`}
                      width="45"
                      height="45"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 45 0 H 0 V 45"
                        fill="none"
                        stroke="#b8d9ef"
                        strokeOpacity=".06"
                      />
                    </pattern>
                  </defs>
                  <rect
                    x="55"
                    y="45"
                    width="790"
                    height="470"
                    rx="30"
                    fill={`url(#${gradientId}-grid)`}
                  />
                  <ellipse
                    cx="450"
                    cy="325"
                    rx="212"
                    ry="126"
                    fill="#000c1c"
                    opacity=".7"
                  />
                  <ellipse
                    cx="450"
                    cy="325"
                    rx="254"
                    ry="162"
                    fill="none"
                    stroke="#5a809f"
                    strokeOpacity=".2"
                    strokeDasharray="3 9"
                  />
                  <path
                    className="lucas-ghost"
                    style={{ opacity: spread * 0.65 }}
                    d="M450 114 L465 186 L643 380 L477 350 L473 388 L427 388 L423 350 L257 380 L435 186 Z"
                  />
                  <g className="lucas-leader-lines">
                    <path
                      className={exteriorSelected ? 'is-active' : ''}
                      d={`M170 320 H220 L${330 - spread * 58} ${315 - spread * 20}`}
                    />
                    <path
                      className={propulsionSelected ? 'is-active' : ''}
                      d={`M600 450 H548 L450 ${402 + spread * 55}`}
                    />
                    <path
                      className={
                        selected === 'guidance-control'
                          ? 'is-active is-context'
                          : 'is-context'
                      }
                      d="M720 180 H660 V160 H614"
                    />
                    <path
                      className={
                        selected === 'payload-role'
                          ? 'is-active is-context'
                          : 'is-context'
                      }
                      d="M200 120 H260 V155 H285"
                    />
                    <path
                      className={
                        selected === 'ground-support'
                          ? 'is-active is-context'
                          : 'is-context'
                      }
                      d="M745 395 H708 V437 H680"
                    />
                  </g>
                  <g className="lucas-context-glyphs">
                    <g
                      className={
                        selected === 'guidance-control' ? 'is-active' : ''
                      }
                    >
                      <rect x="574" y="135" width="38" height="38" rx="8" />
                      <path d="M585 154 H601 M593 146 V162" />
                    </g>
                    <g
                      className={selected === 'payload-role' ? 'is-active' : ''}
                    >
                      <path d="M305 136 L323 146 V166 L305 177 L287 166 V146 Z M298 156 H312" />
                    </g>
                    <g
                      className={
                        selected === 'ground-support' ? 'is-active' : ''
                      }
                    >
                      <rect x="640" y="423" width="33" height="22" rx="3" />
                      <path d="M635 451 H678 M656 445 V451" />
                    </g>
                  </g>
                  <g
                    className={`lucas-exterior-piece lucas-left-wing ${exteriorSelected ? 'is-active' : ''}`}
                    onClick={() => selectTopic('external-airframe')}
                    style={{
                      transform: `translate(${-spread * 75}px, ${-spread * 18}px) rotate(${-spread * 7}deg)`,
                      transformOrigin: '428px 290px',
                    }}
                  >
                    <path
                      d="M438 181 L257 380 L426 352 Z"
                      fill={`url(#${gradientId}-shell)`}
                    />
                    <path d="M257 380 L273 325 L279 374 Z" fill="#9aafbc" />
                    <path
                      className="lucas-shell-highlight"
                      d="M438 181 L273 361 L423 339"
                    />
                  </g>
                  <g
                    className={`lucas-exterior-piece lucas-right-wing ${exteriorSelected ? 'is-active' : ''}`}
                    onClick={() => selectTopic('external-airframe')}
                    style={{
                      transform: `translate(${spread * 75}px, ${-spread * 18}px) rotate(${spread * 7}deg)`,
                      transformOrigin: '472px 290px',
                    }}
                  >
                    <path
                      d="M462 181 L643 380 L474 352 Z"
                      fill={`url(#${gradientId}-shell)`}
                    />
                    <path d="M643 380 L627 325 L621 374 Z" fill="#9aafbc" />
                    <path
                      className="lucas-shell-highlight"
                      d="M462 181 L627 361 L477 339"
                    />
                  </g>
                  <g
                    className={`lucas-exterior-piece lucas-central-shell ${exteriorSelected ? 'is-active' : ''}`}
                    onClick={() => selectTopic('external-airframe')}
                    style={{ transform: `translateY(${-spread * 28}px)` }}
                  >
                    <path
                      d="M450 113 C440 130 434 166 431 212 L426 357 Q426 381 436 387 H464 Q474 381 474 357 L469 212 C466 166 460 130 450 113 Z"
                      fill={`url(#${gradientId}-body)`}
                    />
                    <path
                      className="lucas-shell-highlight"
                      d="M450 123 C441 160 443 271 442 356"
                    />
                  </g>
                  <g
                    className={`lucas-exterior-piece lucas-visible-propulsion ${propulsionSelected ? 'is-active' : ''}`}
                    onClick={() => selectTopic('propulsion')}
                    style={{ transform: `translateY(${spread * 55}px)` }}
                  >
                    <path d="M450 387 V406" stroke="#a0b7c7" strokeWidth="6" />
                    <path
                      d="M450 402 C431 393 405 394 390 401 C409 408 433 409 450 402 C469 412 495 411 510 403 C491 396 467 396 450 402 Z"
                      fill="#b3a88c"
                    />
                    <circle cx="450" cy="402" r="7" fill="#718797" />
                  </g>
                </svg>
                {systems.map((topic, i) => {
                  const placement = topics[topic.id];
                  if (!placement) return null;
                  return (
                    <button
                      key={topic.id}
                      className={`lucas-hotspot ${placement.kind !== 'Exterior form' ? 'is-context' : ''}`}
                      style={{
                        left: `${placement.x / 9}%`,
                        top: `${placement.y / 5.6}%`,
                      }}
                      aria-label={`Inspect ${topic.title}`}
                      aria-pressed={selected === topic.id}
                      title={`${topic.title} — ${placement.kind}`}
                      onClick={() => selectTopic(topic.id)}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <figcaption id={figureId} className="lucas-figure-caption">
          <MousePointer2 size={15} />
          {mode === 'exterior'
            ? 'Choose a topic or explode the exterior to explore the interactive diagram.'
            : 'Select numbered points. Solid lines identify exterior zones; dashed lines identify separate research topics.'}
        </figcaption>
      </figure>
      <div className="lucas-topic-strip" aria-label="Visual system topics">
        {systems.map((topic, i) => (
          <button
            key={topic.id}
            aria-pressed={topic.id === selected}
            onClick={() => selectTopic(topic.id)}
          >
            <span>{String(i + 1).padStart(2, '0')}</span>
            <span>
              <strong>{topics[topic.id]?.label || topic.title}</strong>
              <small>{topics[topic.id]?.kind || 'System topic'}</small>
            </span>
            <ChevronRight size={14} />
          </button>
        ))}
      </div>
      <div className="studio-controls">
        <button
          className="studio-explode"
          onClick={() => setSpread(separation ? 0 : 85)}
        >
          <Layers3 size={18} />{' '}
          {separation ? 'Assemble exterior' : 'Explode exterior'}
        </button>
        <label className="studio-slider">
          <span>
            Exterior separation <output>{separation}%</output>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={separation}
            aria-label="Exterior separation"
            onChange={(e) => setSpread(Number(e.target.value))}
          />
        </label>
      </div>
      <p className="studio-disclosure">
        AI-generated exterior illustration and conceptual exterior sections.
        Movement is illustrative, not a mechanical assembly sequence. Research
        topics do not indicate internal locations. No measured CAD or internal
        weapons components.
      </p>
    </section>
  );
}
