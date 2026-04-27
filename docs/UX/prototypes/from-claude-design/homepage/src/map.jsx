// ============ Illustrated Adventure Map of India ============
// Pirate / fantasy cartography style: parchment, hand-drawn icons,
// dashed routes, sea creatures, mountains, tigers, temples.

const { useState, useMemo, useEffect, useRef } = React;

// Approximated India silhouette (viewBox 0 0 100 130)
const INDIA_OUTLINE = "M50,5 C54,4 59,5 63,7 C66,9 68,13 67,16 C66,18 64,19 65,21 C68,21 72,20 76,22 C79,24 80,28 77,31 C74,33 70,33 67,34 C64,35 62,39 64,42 C68,43 73,45 76,49 C79,54 80,60 78,65 C75,70 70,72 67,76 C64,80 62,86 60,92 C58,98 56,104 54,109 C52,115 49,121 46,121 C44,120 42,115 40,108 C38,101 36,94 34,87 C32,80 30,73 27,67 C24,60 21,54 20,48 C20,41 23,34 26,29 C28,25 26,22 26,18 C27,15 30,13 33,12 C37,10 41,9 44,7 C46,6 48,5 50,5 Z";

// 9 regions with icons and positions
const MAP_REGIONS = [
  { id: 'ladakh',    name: 'Ладакх',       sub: 'Горы · Монастыри',        x: 44, y: 10, ico: 'mountain',  tag: 'Mountain',  color: '#6fa8d6', linkToTour: 'ladakh' },
  { id: 'kashmir',   name: 'Кашмир',       sub: 'Озёра · Шафран',          x: 36, y: 14, ico: 'lake',      tag: 'Heritage',  color: '#d6a85f', linkToTour: 'rajasthan' },
  { id: 'punjab',    name: 'Пенджаб',      sub: 'Золотой храм',            x: 40, y: 22, ico: 'temple',    tag: 'Sacred',    color: '#ffc85a', linkToTour: 'varanasi' },
  { id: 'rajasthan', name: 'Раджастан',    sub: 'Дворцы · Пустыня · Тигры',x: 30, y: 34, ico: 'tiger',     tag: 'Heritage',  color: '#ff7a2e', linkToTour: 'rajasthan' },
  { id: 'agra',      name: 'Агра',         sub: 'Тадж-Махал',              x: 48, y: 30, ico: 'taj',       tag: 'Heritage',  color: '#e0408d', linkToTour: 'rajasthan' },
  { id: 'varanasi',  name: 'Варанаси',     sub: 'Гхаты · Ганга · Аарти',   x: 58, y: 38, ico: 'fire',      tag: 'Sacred',    color: '#c9522a', linkToTour: 'varanasi' },
  { id: 'gujarat',   name: 'Гуджарат',     sub: 'Белая пустыня',           x: 20, y: 42, ico: 'camel',     tag: 'Desert',    color: '#d9a559', linkToTour: 'rajasthan' },
  { id: 'goa',       name: 'Гоа',          sub: 'Пляжи · Закаты · Байки',  x: 28, y: 70, ico: 'surf',      tag: 'Coastal',   color: '#ffb84d', linkToTour: 'goa' },
  { id: 'kerala',    name: 'Керала',       sub: 'Бэкуотеры · Слоны · Аюрведа', x: 38, y: 92, ico: 'elephant', tag: 'Wellness', color: '#3d8b4a', linkToTour: 'kerala' },
];

// Pre-defined tour routes as arrays of region ids
const MAP_ROUTES = [
  { id: 'golden-triangle', name: 'Золотой треугольник', color: '#e0408d', icon: 'car',    path: ['punjab', 'agra', 'rajasthan'] },
  { id: 'himalaya-path',   name: 'Путь в Гималаи',       color: '#6fa8d6', icon: 'car',    path: ['agra', 'kashmir', 'ladakh'] },
  { id: 'south-coast',     name: 'Южное побережье',      color: '#3d8b4a', icon: 'car',    path: ['goa', 'kerala'] },
  { id: 'moto-rally',      name: 'Мото-раллí «Enfield»', color: '#c9522a', icon: 'moto',   path: ['goa', 'rajasthan', 'agra', 'kashmir', 'ladakh'] },
  { id: 'maharaja-train',  name: 'Поезд «Maharajas Express»', color: '#b8860b', icon: 'train', path: ['agra', 'rajasthan', 'gujarat', 'varanasi', 'punjab'] },
  { id: 'sea-cruise',      name: 'Морской круиз',        color: '#1e6f8f', icon: 'ship',   path: ['goa', 'kerala'], sea: true },
];

// ===== Hand-drawn icons =====
function MapIcon({ type, x = 0, y = 0, scale = 1, color = '#f5ecdb' }) {
  const t = `translate(${x}, ${y}) scale(${scale})`;
  const stroke = "rgba(40,20,5,0.85)";
  const sw = 0.4;
  const parchmentHighlight = "rgba(255,240,200,0.85)";

  switch (type) {
    case 'mountain':
      return (
        <g transform={t}>
          {/* back peak */}
          <path d="M-4,2 L-1,-3.5 L1.5,0 L4,-2 L6,2 Z" fill="#9fb8d0" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          {/* front peak */}
          <path d="M-5,3 L-2,-2.5 L0,1 L2,-1 L5,3 Z" fill="#f5ecdb" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          {/* snow caps */}
          <path d="M-2.5,-1 L-2,-2.5 L-1.5,-1.5 L-1,-2 L-0.5,-1" fill="none" stroke="#fff" strokeWidth={sw*0.8} />
        </g>
      );
    case 'lake':
      return (
        <g transform={t}>
          <ellipse cx="0" cy="1" rx="4.5" ry="2.2" fill="#a8c8e8" stroke={stroke} strokeWidth={sw} />
          <path d="M-3,0 Q-1.5,-0.5 0,0 T3,0" fill="none" stroke="#fff" strokeWidth={sw*0.8} opacity="0.7" />
          {/* boat */}
          <path d="M-1,1 L1.5,1 L1,1.8 L-0.5,1.8 Z" fill="#8b5a2b" stroke={stroke} strokeWidth={sw*0.7} />
          <line x1="0" y1="1" x2="0" y2="-1.5" stroke={stroke} strokeWidth={sw*0.7} />
          <path d="M0,-1.5 L1.5,0 L0,0.3 Z" fill="#f5ecdb" stroke={stroke} strokeWidth={sw*0.6} />
        </g>
      );
    case 'temple':
      return (
        <g transform={t}>
          {/* base */}
          <rect x="-3" y="1" width="6" height="2.2" fill="#d9a559" stroke={stroke} strokeWidth={sw} />
          {/* pillars */}
          <rect x="-2.5" y="-1.5" width="1" height="2.8" fill="#f5ecdb" stroke={stroke} strokeWidth={sw} />
          <rect x="-0.5" y="-1.5" width="1" height="2.8" fill="#f5ecdb" stroke={stroke} strokeWidth={sw} />
          <rect x="1.5" y="-1.5" width="1" height="2.8" fill="#f5ecdb" stroke={stroke} strokeWidth={sw} />
          {/* dome */}
          <path d="M-3,-1.5 Q0,-5 3,-1.5 Z" fill="#ffc85a" stroke={stroke} strokeWidth={sw} />
          {/* flag */}
          <line x1="0" y1="-5" x2="0" y2="-6.5" stroke={stroke} strokeWidth={sw*0.7} />
          <path d="M0,-6.5 L1.5,-6 L0,-5.5 Z" fill="#e0408d" stroke={stroke} strokeWidth={sw*0.5} />
        </g>
      );
    case 'taj':
      return (
        <g transform={t}>
          {/* base platform */}
          <rect x="-4" y="2" width="8" height="1" fill="#f5ecdb" stroke={stroke} strokeWidth={sw} />
          {/* main dome */}
          <path d="M-2,2 Q-2,-2 0,-3 Q2,-2 2,2 Z" fill="#f5ecdb" stroke={stroke} strokeWidth={sw} />
          <circle cx="0" cy="-3.2" r="0.3" fill="#f5ecdb" stroke={stroke} strokeWidth={sw*0.6} />
          {/* side minarets */}
          <path d="M-3.5,2 L-3.5,-1 L-3,-1.5 L-2.5,-1 L-2.5,2" fill="#f5ecdb" stroke={stroke} strokeWidth={sw*0.8} />
          <path d="M2.5,2 L2.5,-1 L3,-1.5 L3.5,-1 L3.5,2" fill="#f5ecdb" stroke={stroke} strokeWidth={sw*0.8} />
          {/* arch */}
          <path d="M-0.7,2 Q-0.7,0 0,-0.3 Q0.7,0 0.7,2" fill={stroke} opacity="0.45" />
        </g>
      );
    case 'tiger':
      return (
        <g transform={t}>
          {/* body */}
          <ellipse cx="0" cy="1" rx="3.8" ry="1.8" fill="#ff7a2e" stroke={stroke} strokeWidth={sw} />
          {/* stripes */}
          <path d="M-2,0.2 L-2,1.8 M-0.5,0 L-0.5,2 M1,0.1 L1,1.9 M2.3,0.3 L2.3,1.7" stroke={stroke} strokeWidth={sw*0.8} />
          {/* legs */}
          <rect x="-2.8" y="1.8" width="0.8" height="1.2" fill="#ff7a2e" stroke={stroke} strokeWidth={sw*0.7} />
          <rect x="1.8" y="1.8" width="0.8" height="1.2" fill="#ff7a2e" stroke={stroke} strokeWidth={sw*0.7} />
          {/* head */}
          <circle cx="3.2" cy="0.3" r="1.5" fill="#ff7a2e" stroke={stroke} strokeWidth={sw} />
          {/* ears */}
          <path d="M2.2,-0.8 L2.5,-1.4 L3,-0.9 Z" fill="#ff7a2e" stroke={stroke} strokeWidth={sw*0.7} />
          <path d="M3.5,-0.9 L4,-1.4 L4.2,-0.7 Z" fill="#ff7a2e" stroke={stroke} strokeWidth={sw*0.7} />
          {/* eyes */}
          <circle cx="2.8" cy="0.2" r="0.2" fill={stroke} />
          <circle cx="3.6" cy="0.2" r="0.2" fill={stroke} />
          {/* tail */}
          <path d="M-3.5,1 Q-5,0 -4.5,-1" fill="none" stroke={stroke} strokeWidth={sw*1.2} strokeLinecap="round" />
        </g>
      );
    case 'elephant':
      return (
        <g transform={t}>
          {/* body */}
          <ellipse cx="0" cy="0.5" rx="3.5" ry="2" fill="#b8a08a" stroke={stroke} strokeWidth={sw} />
          {/* head */}
          <circle cx="3" cy="-0.5" r="1.8" fill="#b8a08a" stroke={stroke} strokeWidth={sw} />
          {/* ear */}
          <ellipse cx="2.5" cy="-1.2" rx="1.2" ry="1.5" fill="#9a8270" stroke={stroke} strokeWidth={sw*0.8} />
          {/* trunk */}
          <path d="M4.3,-0.2 Q5.5,0.8 5,2 Q4.5,2.8 3.8,2.3" fill="#b8a08a" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          {/* legs */}
          <rect x="-2.5" y="2" width="0.9" height="1.5" fill="#b8a08a" stroke={stroke} strokeWidth={sw*0.7} />
          <rect x="-0.8" y="2" width="0.9" height="1.5" fill="#b8a08a" stroke={stroke} strokeWidth={sw*0.7} />
          <rect x="1" y="2" width="0.9" height="1.5" fill="#b8a08a" stroke={stroke} strokeWidth={sw*0.7} />
          {/* tusk */}
          <path d="M4.2,0.3 L5,1 L4.3,0.8" fill="#fff" stroke={stroke} strokeWidth={sw*0.5} />
          {/* eye */}
          <circle cx="3.3" cy="-0.5" r="0.2" fill={stroke} />
        </g>
      );
    case 'camel':
      return (
        <g transform={t}>
          {/* body with two humps */}
          <path d="M-3.5,1 Q-3,-1.5 -1.5,-0.5 Q0,-2 1.5,-0.5 Q3,-1 3.5,1 Z" fill="#d9a559" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          {/* neck + head */}
          <path d="M3,-0.3 L4.2,-2 L5,-2 L5.2,-1.3 L4.5,-0.5" fill="#d9a559" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <circle cx="4.7" cy="-1.7" r="0.2" fill={stroke} />
          {/* legs */}
          <line x1="-2.5" y1="1" x2="-2.5" y2="3" stroke={stroke} strokeWidth={sw*1.2} />
          <line x1="-1" y1="1" x2="-1" y2="3" stroke={stroke} strokeWidth={sw*1.2} />
          <line x1="1" y1="1" x2="1" y2="3" stroke={stroke} strokeWidth={sw*1.2} />
          <line x1="2.5" y1="1" x2="2.5" y2="3" stroke={stroke} strokeWidth={sw*1.2} />
        </g>
      );
    case 'surf':
      return (
        <g transform={t}>
          {/* sun */}
          <circle cx="0" cy="-2.5" r="1.5" fill="#ffc85a" stroke={stroke} strokeWidth={sw} />
          {/* rays */}
          <g stroke={stroke} strokeWidth={sw*0.7} strokeLinecap="round">
            <line x1="0" y1="-5" x2="0" y2="-4.3" />
            <line x1="-2.3" y1="-4" x2="-1.7" y2="-3.5" />
            <line x1="2.3" y1="-4" x2="1.7" y2="-3.5" />
            <line x1="-3" y1="-2.5" x2="-2.3" y2="-2.5" />
            <line x1="3" y1="-2.5" x2="2.3" y2="-2.5" />
          </g>
          {/* palm */}
          <path d="M3,3 Q3.3,0 3,-1" fill="none" stroke={stroke} strokeWidth={sw*1.3} strokeLinecap="round" />
          <path d="M3,-1 Q1,-2 0,-1.5 M3,-1 Q5,-2 6,-1.5 M3,-1 Q1.5,-2.5 1,-2.5 M3,-1 Q5,-2.5 5.5,-2.5" fill="none" stroke="#3d8b4a" strokeWidth={sw*1.3} strokeLinecap="round" />
          {/* waves */}
          <path d="M-5,2 Q-4,1.5 -3,2 T-1,2 T1,2" fill="none" stroke="#6fa8d6" strokeWidth={sw} strokeLinecap="round" />
          <path d="M-5,3.5 Q-4,3 -3,3.5 T-1,3.5 T1,3.5" fill="none" stroke="#6fa8d6" strokeWidth={sw} strokeLinecap="round" />
        </g>
      );
    case 'fire':
      return (
        <g transform={t}>
          {/* boat */}
          <path d="M-4,2 L4,2 L3,3.2 L-3,3.2 Z" fill="#8b5a2b" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          {/* flame stack */}
          <path d="M-0.5,2 Q-1.5,0 0,-1 Q0.3,0 -0.3,1 Z" fill="#ff7a2e" stroke={stroke} strokeWidth={sw*0.7} />
          <path d="M0,2 Q-0.5,-0.5 0.5,-2 Q1,-0.5 0.5,1 Z" fill="#ffc85a" stroke={stroke} strokeWidth={sw*0.7} />
          <path d="M0.5,2 Q0.2,0 1,-1 Q1.3,0 0.8,1 Z" fill="#e0408d" stroke={stroke} strokeWidth={sw*0.7} />
          {/* water */}
          <path d="M-5,3.5 Q-4,3 -3,3.5 T-1,3.5 T1,3.5 T3,3.5 T5,3.5" fill="none" stroke="#6fa8d6" strokeWidth={sw} />
        </g>
      );
    default:
      return null;
  }
}

function SeaCreature({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`} opacity="0.55">
      {/* body coil */}
      <path d="M0,0 Q3,-2 5,0 Q7,2 9,0 Q11,-2 13,0" fill="none"
            stroke="rgba(90,50,20,0.6)" strokeWidth="0.5" strokeLinecap="round" />
      {/* head */}
      <circle cx="-0.5" cy="0" r="1.3" fill="rgba(90,50,20,0.4)" stroke="rgba(90,50,20,0.7)" strokeWidth="0.3" />
      <circle cx="-0.8" cy="-0.3" r="0.2" fill="rgba(245,236,219,0.9)" />
      {/* spikes */}
      <path d="M2,-1.5 L2.3,-2.5 L2.6,-1.5 M5,-1.5 L5.3,-2.5 L5.6,-1.5 M8,-1.5 L8.3,-2.5 L8.6,-1.5"
            fill="none" stroke="rgba(90,50,20,0.6)" strokeWidth="0.3" />
    </g>
  );
}

function Ship({ x, y, rot = 0 }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`} opacity="0.75">
      <path d="M-3,1 L3,1 L2.2,2.2 L-2.2,2.2 Z" fill="#8b5a2b" stroke="rgba(40,20,5,0.8)" strokeWidth="0.3" />
      <line x1="0" y1="1" x2="0" y2="-3" stroke="rgba(40,20,5,0.8)" strokeWidth="0.3" />
      <path d="M0,-3 L2.2,0 L0,0.5 Z" fill="#f5ecdb" stroke="rgba(40,20,5,0.8)" strokeWidth="0.3" />
      <path d="M0,-3 L-1.5,-1 L0,-0.5 Z" fill="#f5ecdb" stroke="rgba(40,20,5,0.8)" strokeWidth="0.3" />
    </g>
  );
}

function Compass() {
  return (
    <g transform="translate(86, 15)">
      <circle r="7" fill="rgba(255,240,200,0.08)" stroke="rgba(90,50,20,0.5)" strokeWidth="0.3" />
      <circle r="5" fill="none" stroke="rgba(90,50,20,0.35)" strokeWidth="0.2" strokeDasharray="0.5 0.5" />
      {/* N / S / E / W */}
      <path d="M0,-5.5 L1,0 L0,5.5 L-1,0 Z" fill="#c9522a" stroke="rgba(40,20,5,0.8)" strokeWidth="0.2" />
      <path d="M0,-5.5 L0.8,0 L0,-0.3 Z" fill="#f5ecdb" stroke="rgba(40,20,5,0.8)" strokeWidth="0.2" />
      <text y="-5.9" textAnchor="middle" fontSize="1.6" fontFamily="Playfair Display, serif" fill="rgba(40,20,5,0.85)" fontStyle="italic">N</text>
      <text y="7" textAnchor="middle" fontSize="1.6" fontFamily="Playfair Display, serif" fill="rgba(40,20,5,0.6)" fontStyle="italic">S</text>
      <text x="6.2" y="0.5" textAnchor="middle" fontSize="1.6" fontFamily="Playfair Display, serif" fill="rgba(40,20,5,0.6)" fontStyle="italic">E</text>
      <text x="-6.2" y="0.5" textAnchor="middle" fontSize="1.6" fontFamily="Playfair Display, serif" fill="rgba(40,20,5,0.6)" fontStyle="italic">W</text>
    </g>
  );
}

// Build smooth path through a sequence of points
function pathThrough(pts, opts = {}) {
  if (pts.length < 2) return '';
  const { sea = false } = opts;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const mx = (p0.x + p1.x) / 2;
    const my = (p0.y + p1.y) / 2 + (sea ? 6 : -3);
    // Sea routes curve outward (west — into Arabian Sea)
    const cx = sea ? Math.min(p0.x, p1.x) - 12 : mx;
    const cy = sea ? (p0.y + p1.y) / 2 : my;
    d += ` Q${cx},${cy} ${p1.x},${p1.y}`;
  }
  return d;
}

// Small inline glyph for route icon next to numbered marker
function RouteGlyph({ type, size = 2 }) {
  const s = size;
  const stroke = "rgba(40,20,5,0.9)";
  if (type === 'moto') {
    return (
      <g>
        <circle cx={-s*0.7} cy={s*0.4} r={s*0.4} fill="none" stroke={stroke} strokeWidth="0.25" />
        <circle cx={s*0.7} cy={s*0.4} r={s*0.4} fill="none" stroke={stroke} strokeWidth="0.25" />
        <path d={`M${-s*0.7},${s*0.4} L0,${-s*0.2} L${s*0.5},${-s*0.2} L${s*0.7},${s*0.4}`} fill="none" stroke={stroke} strokeWidth="0.25" />
      </g>
    );
  }
  if (type === 'train') {
    return (
      <g>
        <rect x={-s*0.7} y={-s*0.5} width={s*1.4} height={s*0.9} rx="0.1" fill="none" stroke={stroke} strokeWidth="0.25" />
        <circle cx={-s*0.4} cy={s*0.55} r={s*0.15} fill={stroke} />
        <circle cx={s*0.4} cy={s*0.55} r={s*0.15} fill={stroke} />
      </g>
    );
  }
  if (type === 'ship') {
    return (
      <g>
        <path d={`M${-s*0.7},${s*0.3} L${s*0.7},${s*0.3} L${s*0.5},${s*0.7} L${-s*0.5},${s*0.7} Z`} fill="none" stroke={stroke} strokeWidth="0.25" />
        <line x1="0" y1={s*0.3} x2="0" y2={-s*0.6} stroke={stroke} strokeWidth="0.2" />
        <path d={`M0,${-s*0.6} L${s*0.5},0 L0,${s*0.1} Z`} fill={stroke} opacity="0.8" />
      </g>
    );
  }
  return null;
}

function IndiaMap() {
  const [active, setActive] = useState('rajasthan');
  const [activeRoute, setActiveRoute] = useState('golden-triangle');
  const current = MAP_REGIONS.find((r) => r.id === active) || MAP_REGIONS[0];
  const route = MAP_ROUTES.find((r) => r.id === activeRoute);
  const routePoints = useMemo(() => route.path.map(id => {
    const r = MAP_REGIONS.find(x => x.id === id);
    return { x: r.x, y: r.y };
  }), [activeRoute]);
  return (
    <section className="section" id="map">
      <div className="wrap">
        <div className="section-label">04 · Atlas</div>
        <div className="section-head">
          <h2 className="section-title">
            Карта<br/><em>приключений.</em>
          </h2>
          <div className="right">
            Кликните по региону, чтобы узнать детали. Переключайтесь между готовыми маршрутами
            или постройте свой. Тигры, храмы, пляжи — всё здесь.
          </div>
        </div>

        <div className="adv-map-wrap">
          {/* Route selector */}
          <div className="adv-map-routes">
            <div className="adv-map-routes-label">Маршруты</div>
            {MAP_ROUTES.map(r => (
              <button key={r.id}
                      className={`adv-route-btn ${activeRoute === r.id ? 'active' : ''}`}
                      style={{'--rc': r.color}}
                      onClick={() => setActiveRoute(r.id)}>
                <span className="adv-route-dot" />
                <span className="adv-route-btn-label">{r.name}</span>
                <span className="adv-route-btn-ico">
                  <svg width="16" height="16" viewBox="-3 -3 6 6">
                    <RouteGlyph type={r.icon} size={1.8} />
                  </svg>
                </span>
              </button>
            ))}
          </div>

          <div className="adv-map-stage">
            <svg className="adv-map-svg" viewBox="-5 -5 110 140" preserveAspectRatio="xMidYMid meet">
              <defs>
                {/* Parchment paper */}
                <radialGradient id="parch" cx="50%" cy="45%" r="70%">
                  <stop offset="0%" stopColor="#f4e3bf" />
                  <stop offset="60%" stopColor="#e8cf9a" />
                  <stop offset="100%" stopColor="#b89361" />
                </radialGradient>
                {/* Ocean */}
                <radialGradient id="ocean" cx="50%" cy="80%" r="70%">
                  <stop offset="0%" stopColor="#7fb5d6" />
                  <stop offset="100%" stopColor="#456f8f" />
                </radialGradient>
                {/* Paper stains */}
                <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" />
                  <feColorMatrix values="0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0 0.1 0 0 0 0.18 0" />
                  <feComposite in2="SourceGraphic" operator="in" />
                </filter>
                {/* Wave pattern */}
                <pattern id="waves" x="0" y="0" width="6" height="3" patternUnits="userSpaceOnUse">
                  <path d="M0,2 Q1.5,0.5 3,2 T6,2" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.2" />
                </pattern>
                {/* Stipple dots for desert */}
                <pattern id="stipple" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
                  <circle cx="1.5" cy="1.5" r="0.25" fill="rgba(160,100,40,0.5)" />
                </pattern>
                {/* Forest pattern */}
                <pattern id="forest" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                  <path d="M2,0.5 L2.8,2 L2.4,2 L2.4,3 L1.6,3 L1.6,2 L1.2,2 Z" fill="rgba(60,110,60,0.45)" />
                </pattern>
                {/* Mountain pattern */}
                <pattern id="mtns" x="0" y="0" width="8" height="4" patternUnits="userSpaceOnUse">
                  <path d="M0,4 L2,1 L3.5,2.5 L5,0.5 L6.5,2.5 L8,4 Z" fill="rgba(100,80,60,0.3)" stroke="rgba(60,40,20,0.5)" strokeWidth="0.15" />
                </pattern>
                {/* Torn edge / rough land border */}
                <filter id="torn">
                  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="12" />
                  <feDisplacementMap in="SourceGraphic" scale="0.8" />
                </filter>
                {/* Drop shadow for icons */}
                <filter id="iconShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="0.3" />
                  <feOffset dx="0.2" dy="0.3" />
                  <feComponentTransfer><feFuncA type="linear" slope="0.4" /></feComponentTransfer>
                  <feComposite in2="SourceGraphic" operator="out" />
                </filter>
              </defs>

              {/* Ocean background */}
              <rect x="-5" y="-5" width="110" height="140" fill="url(#ocean)" />
              <rect x="-5" y="-5" width="110" height="140" fill="url(#waves)" />

              {/* Sea creatures and ships (decorative) */}
              <SeaCreature x="70" y="95" />
              <SeaCreature x="5" y="110" />
              <Ship x="85" y="110" rot={15} />
              <Ship x="10" y="85" rot={-10} />

              {/* Landmass shadow */}
              <path d={INDIA_OUTLINE} fill="rgba(60,30,10,0.35)" transform="translate(0.8, 1.2)" />

              {/* Landmass — parchment */}
              <path d={INDIA_OUTLINE} fill="url(#parch)" stroke="rgba(80,50,20,0.7)" strokeWidth="0.4" strokeLinejoin="round" />
              {/* Landmass texture: terrain fills clipped to shape */}
              <clipPath id="indiaClip"><path d={INDIA_OUTLINE} /></clipPath>

              <g clipPath="url(#indiaClip)">
                {/* Himalaya mountain pattern at top */}
                <rect x="15" y="5" width="70" height="20" fill="url(#mtns)" opacity="0.85" />
                {/* Thar desert stipple */}
                <rect x="15" y="28" width="25" height="18" fill="url(#stipple)" opacity="0.9" />
                {/* Central plains - lighter */}
                <rect x="30" y="46" width="50" height="25" fill="rgba(220,180,120,0.2)" />
                {/* Forests south */}
                <rect x="30" y="72" width="35" height="25" fill="url(#forest)" opacity="0.9" />

                {/* Rivers */}
                {/* Ganga */}
                <path d="M48,22 Q52,28 55,33 Q58,38 62,42 Q66,46 70,50" fill="none"
                      stroke="#4a7fa8" strokeWidth="0.7" strokeLinecap="round" opacity="0.85" />
                <path d="M48,22 Q52,28 55,33 Q58,38 62,42 Q66,46 70,50" fill="none"
                      stroke="#a8d0ec" strokeWidth="0.3" strokeLinecap="round" />
                {/* Narmada */}
                <path d="M25,48 Q30,50 38,49 Q46,48 52,50" fill="none"
                      stroke="#4a7fa8" strokeWidth="0.5" strokeLinecap="round" opacity="0.7" />
                {/* Yamuna */}
                <path d="M42,22 Q46,28 48,32" fill="none" stroke="#4a7fa8" strokeWidth="0.5" strokeLinecap="round" opacity="0.75" />
              </g>

              {/* Coastline rough echo */}
              <path d={INDIA_OUTLINE} fill="none" stroke="rgba(80,50,20,0.3)" strokeWidth="0.2" strokeDasharray="0.6 0.8" transform="translate(1.5, 0.5)" />

              {/* Region icons (non-pin decorations, large) */}
              {MAP_REGIONS.map((r) => (
                <MapIcon key={`ic-${r.id}`} type={r.ico} x={r.x} y={r.y - 1.5} scale={active === r.id ? 0.85 : 0.65} />
              ))}

              {/* Route path */}
              {route && (
                <>
                  <path d={pathThrough(routePoints, {sea: route.sea})}
                        fill="none"
                        stroke={route.color}
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeDasharray={route.icon === 'train' ? '0.6 0.6' : (route.icon === 'ship' ? '2 1' : '1.5 1.5')}
                        className="adv-route-path" />
                  {/* Route markers */}
                  {routePoints.map((p, i) => (
                    <g key={`rp-${i}`} transform={`translate(${p.x}, ${p.y})`}>
                      <circle r="2.2" fill="#fff" stroke={route.color} strokeWidth="0.6" />
                      <text y="0.9" textAnchor="middle" fontSize="2.4" fontFamily="Playfair Display, serif" fontWeight="700" fill={route.color}>
                        {i + 1}
                      </text>
                    </g>
                  ))}
                  {/* Vehicle glyph near the last marker */}
                  {routePoints.length > 0 && (
                    <g transform={`translate(${routePoints[routePoints.length-1].x + 4}, ${routePoints[routePoints.length-1].y - 3})`}>
                      <circle r="2" fill={route.color} stroke="rgba(40,20,5,0.8)" strokeWidth="0.2" />
                      <RouteGlyph type={route.icon} size={1.5} />
                    </g>
                  )}
                </>
              )}

              {/* Region labels (clickable) */}
              {MAP_REGIONS.map((r) => {
                const isActive = active === r.id;
                const onRoute = route && route.path.includes(r.id);
                return (
                  <g key={r.id}
                     transform={`translate(${r.x}, ${r.y})`}
                     onClick={() => setActive(r.id)}
                     onMouseEnter={() => setActive(r.id)}
                     style={{cursor:'pointer'}}>
                    <g className={`adv-pin ${isActive ? 'active' : ''} ${onRoute ? 'on-route' : ''}`}>
                      {/* hit target */}
                      <circle r="5" fill="transparent" />
                      {/* label badge */}
                      <g transform="translate(0, 4.8)">
                        <rect x="-7" y="-0.8" width="14" height="2.4" rx="1.2"
                              fill={isActive ? r.color : 'rgba(244,227,191,0.95)'}
                              stroke="rgba(60,30,10,0.75)" strokeWidth="0.2" />
                        <text y="0.9" textAnchor="middle"
                              fontSize="1.5" fontFamily="Playfair Display, serif" fontWeight="600" fontStyle="italic"
                              fill={isActive ? '#fff' : 'rgba(40,20,5,0.9)'}>
                          {r.name}
                        </text>
                      </g>
                      {/* Active ping */}
                      {isActive && (
                        <>
                          <circle r="3.5" fill="none" stroke={r.color} strokeWidth="0.4" className="adv-ping" />
                          <circle r="5" fill="none" stroke={r.color} strokeWidth="0.3" className="adv-ping adv-ping-2" />
                        </>
                      )}
                    </g>
                  </g>
                );
              })}

              {/* Compass rose */}
              <Compass />

              {/* Scale */}
              <g transform="translate(6, 122)">
                <line x1="0" y1="0" x2="14" y2="0" stroke="rgba(40,20,5,0.7)" strokeWidth="0.3" />
                <line x1="0" y1="-1" x2="0" y2="1" stroke="rgba(40,20,5,0.7)" strokeWidth="0.3" />
                <line x1="7" y1="-0.6" x2="7" y2="0.6" stroke="rgba(40,20,5,0.7)" strokeWidth="0.3" />
                <line x1="14" y1="-1" x2="14" y2="1" stroke="rgba(40,20,5,0.7)" strokeWidth="0.3" />
                <text x="7" y="3.5" textAnchor="middle" fontSize="1.6" fontFamily="Playfair Display, serif" fontStyle="italic" fill="rgba(40,20,5,0.8)">500 км</text>
              </g>

              {/* Map title cartouche */}
              <g transform="translate(72, 118)">
                <rect x="-18" y="-5" width="36" height="10" fill="rgba(244,227,191,0.95)" stroke="rgba(60,30,10,0.7)" strokeWidth="0.3" rx="0.6" />
                <text y="-0.5" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="3.5" fontWeight="700" fontStyle="italic" fill="rgba(40,20,5,0.9)">
                  HINDUSTAN
                </text>
                <text y="3" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="1.3" fill="rgba(80,50,20,0.7)" letterSpacing="0.2em">
                  A TRAVELLER'S ATLAS · MMXXVI
                </text>
              </g>

              {/* Grid ticks */}
              <g stroke="rgba(60,30,10,0.2)" strokeWidth="0.1">
                <line x1="-5" y1="30" x2="105" y2="30" />
                <line x1="-5" y1="60" x2="105" y2="60" />
                <line x1="-5" y1="90" x2="105" y2="90" />
                <line x1="20" y1="-5" x2="20" y2="135" />
                <line x1="50" y1="-5" x2="50" y2="135" />
                <line x1="80" y1="-5" x2="80" y2="135" />
              </g>

              {/* Tropic of cancer */}
              <line x1="-5" y1="52" x2="105" y2="52" stroke="rgba(60,30,10,0.35)" strokeWidth="0.2" strokeDasharray="1 1" />
              <text x="-3" y="51" fontSize="1.6" fontFamily="JetBrains Mono, monospace" fontStyle="italic" fill="rgba(60,30,10,0.6)" letterSpacing="0.15em">TROPICUS CANCRI · 23°N</text>

              {/* Frame */}
              <rect x="-4" y="-4" width="108" height="138" fill="none" stroke="rgba(60,30,10,0.55)" strokeWidth="0.5" />
              <rect x="-2.5" y="-2.5" width="105" height="135" fill="none" stroke="rgba(60,30,10,0.35)" strokeWidth="0.2" />
            </svg>

            {/* Detail overlay */}
            <div className="adv-map-detail" style={{'--dc': current.color}}>
              <div className="adv-detail-head">
                <div className="adv-detail-tag">{current.tag}</div>
                <h4>{current.name}</h4>
                <div className="adv-detail-sub">{current.sub}</div>
              </div>
              <a href="#tours" className="adv-detail-cta">
                Смотреть туры <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { IndiaMap });
