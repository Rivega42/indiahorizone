// ============ Destinations ============
function DestCard({ d, i, hover, setHover }) {
  const gallery = d.gallery || [d.img];
  const [idx, setIdx] = React.useState(0);
  const isHover = hover === i;
  React.useEffect(() => {
    const interval = isHover ? 1600 : 4800;
    const t = setInterval(() => setIdx((v) => (v + 1) % gallery.length), interval);
    return () => clearInterval(t);
  }, [isHover, gallery.length]);
  return (
    <a href={`#tours`} className="dest" key={d.num}
       onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
      <div className="dest-img">
        {gallery.map((src, gi) => (
          <div key={gi}
               className={`ph-image dest-slide ${gi === idx ? 'active' : ''}`}
               style={{backgroundImage: `url(${src})`}} />
        ))}
        <div className="dest-dots">
          {gallery.map((_, gi) => (
            <button key={gi}
              className={`dest-dot ${gi === idx ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx(gi); }}
              aria-label={`Фото ${gi+1}`} />
          ))}
        </div>
      </div>
      <div className="dest-body">
        <div className="dest-top">
          <span className="dest-num">{d.num} · {d.days}</span>
          <span className="dest-tag">{d.tag}</span>
        </div>
        <div className="dest-bottom">
          <div>
            <h3>{d.name}</h3>
            <div className="dest-sub">{d.sub}</div>
          </div>
          <div className="dest-arrow">→</div>
        </div>
      </div>
    </a>
  );
}
function Destinations() {
  const [hover, setHover] = useState(null);
  const D = window.IH_DATA.destinations;
  return (
    <section className="section" id="direction">
      <div className="wrap">
        <div className="section-label">02 · Directions</div>
        <div className="section-head">
          <h2 className="section-title">
            Четыре <em>вселенные</em><br/>в одной стране.
          </h2>
          <div className="right">
            Каждое направление — отдельный сценарий. Мы фокусируемся на четырёх,
            чтобы проработать каждое до уровня частной консьерж-службы.
          </div>
        </div>
        <div className="dests">
          {D.map((d, i) => (
            <DestCard key={d.num} d={d} i={i} hover={hover} setHover={setHover} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ Tours ============
function Tours() {
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState('popular');
  const tours = window.IH_DATA.tours;
  const cats = [
    { id: 'all', label: 'Все маршруты' },
    { id: 'heritage', label: 'Heritage' },
    { id: 'wellness', label: 'Wellness' },
    { id: 'beach', label: 'Beach' },
    { id: 'mountain', label: 'Mountain' },
  ];
  const filtered = cat === 'all' ? tours : tours.filter((t) => t.category === cat);

  return (
    <section className="section" id="tours">
      <div className="wrap">
        <div className="section-label">03 · Collection</div>
        <div className="section-head">
          <h2 className="section-title">
            Туры, которые мы бы <em>выбрали</em> сами.
          </h2>
          <div className="right">
            Каждый маршрут протестирован командой и как минимум одним семейством
            гостей. Если тур попал в коллекцию — он работает.
          </div>
        </div>

        <div className="tours-controls">
          {cats.map((c) => (
            <button key={c.id}
                    className={`chip ${cat === c.id ? 'active chip-accent' : ''}`}
                    onClick={() => setCat(c.id)}>
              {c.label}
            </button>
          ))}
          <div className="divider" />
          <button className={`chip ${sort === 'popular' ? 'active' : ''}`} onClick={() => setSort('popular')}>Популярное</button>
          <button className={`chip ${sort === 'price' ? 'active' : ''}`} onClick={() => setSort('price')}>Цена ↑</button>
          <button className={`chip ${sort === 'new' ? 'active' : ''}`} onClick={() => setSort('new')}>Новинки</button>
          <div className="spacer" />
          <div className="result-count">{filtered.length.toString().padStart(2,'0')} / {tours.length} маршрутов</div>
        </div>

        <div className="tours-grid">
          {filtered.map((t) => (
            <article key={t.id} className="tour">
              <div className="tour-media">
                <div className="ph-image" style={{backgroundImage: `url(${t.img})`, backgroundSize: 'cover', backgroundPosition: 'center'}} />
                <div className="tour-ribbon">
                  {t.hot && <span className="pill hot">Hot</span>}
                  <span className="pill">{t.category}</span>
                </div>
                <div className="tour-duration">{t.duration}</div>
                <div className="tour-play" />
              </div>
              <div className="tour-body">
                <div className="tour-head">
                  <div>
                    <h3 className="tour-title">{t.title}</h3>
                    <div className="tour-loc">{t.loc}</div>
                  </div>
                  <div className="tour-rating">
                    <div className="star" />
                    {t.rating}<span style={{color:'var(--ink-mute)'}}>/{t.reviews}</span>
                  </div>
                </div>
                <p className="tour-desc">{t.desc}</p>
                <div className="tour-tags">
                  {t.tags.map((tag) => <span className="tour-tag" key={tag}>{tag}</span>)}
                </div>
                <div className="tour-foot">
                  <div>
                    <div className="tour-price-label">От</div>
                    <div className="tour-price">
                      <em>{t.price}</em> <span style={{fontFamily:'Playfair Display, serif', fontStyle:'normal'}}>₽</span>
                      {t.priceOld && <span style={{fontSize:14, color:'var(--ink-mute)', textDecoration:'line-through', marginLeft:10, fontStyle:'normal'}}>{t.priceOld} ₽</span>}
                    </div>
                  </div>
                  <Magnetic strength={0.3}>
                    <button className="tour-btn">Детали<span>→</span></button>
                  </Magnetic>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ Map of India · Illustrated ============
function IndiaMap() {
  const regions = window.IH_DATA.regions;
  const [active, setActive] = useState('himalaya');
  const current = regions.find((r) => r.id === active);

  // Realistic-ish India silhouette, viewBox 0 0 100 130
  const indiaPath = "M48,6 L54,5 L60,7 L64,10 L66,14 L64,17 L67,20 L72,20 L76,22 L78,26 L76,30 L72,32 L68,32 L64,34 L62,38 L66,41 L70,42 L74,46 L76,51 L78,56 L76,61 L72,64 L68,68 L64,72 L62,78 L60,84 L58,90 L56,96 L54,102 L52,108 L50,114 L48,120 L46,122 L44,120 L42,114 L40,108 L38,102 L36,96 L34,90 L32,84 L30,78 L28,72 L26,66 L24,60 L22,54 L22,48 L24,42 L26,38 L28,34 L30,30 L28,26 L26,22 L28,18 L32,16 L36,14 L40,12 L44,10 L46,8 Z";

  return (
    <section className="section" id="map">
      <div className="wrap">
        <div className="section-label">04 · Geography</div>
        <div className="section-head">
          <h2 className="section-title">
            Вся страна —<br/><em>на одном экране.</em>
          </h2>
          <div className="right">
            Кликните по региону. Мы покажем, что мы знаем о нём лучше других,
            и какие маршруты туда уже в работе.
          </div>
        </div>

        <div className="map-wrap map-wrap--illustrated">
          <svg className="map-svg" viewBox="0 0 100 130" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="mg-ocean" cx="50%" cy="60%">
                <stop offset="0%" stopColor="rgba(107,76,255,0.12)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <linearGradient id="mg-land" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,200,90,0.16)" />
                <stop offset="50%" stopColor="rgba(255,122,46,0.10)" />
                <stop offset="100%" stopColor="rgba(224,64,141,0.14)" />
              </linearGradient>
              <filter id="mapGlow">
                <feGaussianBlur stdDeviation="1.2" />
              </filter>
              <pattern id="waves" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                <path d="M0,2 Q1,1 2,2 T4,2" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
              </pattern>
            </defs>

            {/* Ocean */}
            <rect width="100" height="130" fill="url(#mg-ocean)" />
            <rect width="100" height="130" fill="url(#waves)" />

            {/* Glow behind landmass */}
            <path d={indiaPath} fill="url(#mg-land)" filter="url(#mapGlow)" opacity="0.9" />

            {/* Landmass */}
            <path d={indiaPath}
                  fill="rgba(255,255,255,0.035)"
                  stroke="rgba(255,200,90,0.35)"
                  strokeWidth="0.5" />

            {/* Terrain: Himalaya mountains (north) */}
            <g opacity="0.55" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" fill="none">
              <path d="M30,14 L33,10 L36,13 L39,9 L42,13 L45,10 L48,14 L51,11 L54,14 L57,11 L60,14 L63,12 L66,15" />
              <path d="M34,18 L36,15 L38,18 L41,15 L44,18 L47,16 L50,19 L53,16 L56,19 L59,17 L62,20" opacity="0.7" />
            </g>
            {/* Rivers: Ganga */}
            <path d="M50,20 Q54,30 58,38 Q62,44 66,50" fill="none"
                  stroke="rgba(107,180,255,0.5)" strokeWidth="0.4" strokeDasharray="0.8 0.4" />
            {/* Rivers: Narmada */}
            <path d="M36,52 Q42,54 48,52 Q54,50 58,52" fill="none"
                  stroke="rgba(107,180,255,0.35)" strokeWidth="0.3" strokeDasharray="0.6 0.4" />
            {/* Desert dots: Rajasthan */}
            <g fill="rgba(255,200,90,0.35)">
              {Array.from({length: 18}).map((_, i) => {
                const cx = 28 + (i % 6) * 2.5;
                const cy = 34 + Math.floor(i / 6) * 2.8;
                return <circle key={i} cx={cx} cy={cy} r={0.3 + (i % 3) * 0.15} />;
              })}
            </g>
            {/* Jungle dots: Kerala/south */}
            <g fill="rgba(107,76,255,0.25)">
              {Array.from({length: 14}).map((_, i) => {
                const cx = 36 + (i % 5) * 2;
                const cy = 90 + Math.floor(i / 5) * 2.5;
                return <circle key={i} cx={cx} cy={cy} r={0.35} />;
              })}
            </g>

            {/* Route arcs between regions */}
            {regions.map((r, i) => {
              if (i === 0) return null;
              const p = regions[i-1];
              const cx = (r.pin[1] + p.pin[1]) / 2;
              const cy = (r.pin[0] + p.pin[0]) / 2 - 8;
              return (
                <path key={`rt-${i}`}
                  d={`M${p.pin[1]},${p.pin[0]} Q${cx},${cy} ${r.pin[1]},${r.pin[0]}`}
                  fill="none"
                  stroke="rgba(255,200,90,0.35)"
                  strokeWidth="0.3"
                  strokeDasharray="0.7 0.5" />
              );
            })}

            {/* Region pins with icons */}
            {regions.map((r) => {
              const isActive = active === r.id;
              return (
                <g key={r.id}
                   className={`map-pin ${isActive ? 'active' : ''}`}
                   transform={`translate(${r.pin[1]}, ${r.pin[0]})`}
                   onClick={() => setActive(r.id)}
                   onMouseEnter={() => setActive(r.id)}>
                  {isActive && <circle className="map-pin-ring" r="6" />}
                  {isActive && <circle className="map-pin-ring" r="3" style={{animationDelay: '0.6s'}} />}
                  <circle r={isActive ? 2.4 : 1.6}
                          fill={isActive ? 'var(--accent-1)' : 'var(--accent-2)'}
                          stroke="rgba(10,6,18,0.8)" strokeWidth="0.5" />
                  <circle r={isActive ? 0.8 : 0.5} fill="rgba(10,6,18,0.9)" />
                  <text y="-4" textAnchor="middle"
                        fontFamily="JetBrains Mono" fontSize="2"
                        fill={isActive ? 'var(--accent-2)' : 'rgba(245,236,219,0.85)'}
                        fontWeight="500"
                        style={{letterSpacing: '0.25em', textTransform: 'uppercase'}}>
                    {r.name}
                  </text>
                  {/* Icon chip */}
                  <text y={isActive ? 7 : 6} textAnchor="middle" fontSize="3"
                        fill={isActive ? 'var(--accent-2)' : 'rgba(245,236,219,0.5)'}>
                    {({himalaya:'▲', rajasthan:'◆', goa:'≈', kerala:'✿', varanasi:'✸'})[r.id]}
                  </text>
                </g>
              );
            })}

            {/* Compass */}
            <g transform="translate(88, 14)" opacity="0.55">
              <circle r="5" fill="none" stroke="rgba(245,236,219,0.25)" strokeWidth="0.3" />
              <circle r="3.5" fill="none" stroke="rgba(245,236,219,0.15)" strokeWidth="0.2" />
              <path d="M0,-4.5 L0.6,0 L0,4.5 L-0.6,0 Z" fill="var(--accent-2)" />
              <text y="-6.5" textAnchor="middle" fontSize="2" fill="rgba(245,236,219,0.6)" fontFamily="JetBrains Mono">N</text>
            </g>

            {/* Tropic of Cancer dashed line */}
            <line x1="15" y1="52" x2="85" y2="52"
                  stroke="rgba(245,236,219,0.12)" strokeWidth="0.15" strokeDasharray="1 1" />
            <text x="16" y="51" fontSize="1.6" fill="rgba(245,236,219,0.4)"
                  fontFamily="JetBrains Mono" style={{letterSpacing:'0.15em'}}>TROPIC OF CANCER · 23°N</text>
          </svg>

          <div className="map-hud">
            <div className="live" />
            Интерактивная карта · {regions.length} регионов
          </div>

          <div className="map-legend">
            <div className="map-legend-title">Legend</div>
            <div className="map-legend-row"><span className="mlg-ico">▲</span> Mountain</div>
            <div className="map-legend-row"><span className="mlg-ico">◆</span> Heritage</div>
            <div className="map-legend-row"><span className="mlg-ico">≈</span> Coastal</div>
            <div className="map-legend-row"><span className="mlg-ico">✿</span> Wellness</div>
            <div className="map-legend-row"><span className="mlg-ico">✸</span> Sacred</div>
          </div>

          <div className="map-detail">
            <div className="map-detail-head">
              <h4>{current.name}</h4>
              <div className="map-detail-icon">{({himalaya:'▲', rajasthan:'◆', goa:'≈', kerala:'✿', varanasi:'✸'})[current.id]}</div>
            </div>
            <div className="loc">{current.loc}</div>
            <p>{current.desc}</p>
            <div className="stats">
              {current.stats.map(([l, v]) => (
                <div key={l}>
                  <div className="stat-lbl">{l}</div>
                  <div className="stat-val">{v}</div>
                </div>
              ))}
            </div>
            <a href="#tours" className="map-detail-cta">
              Смотреть туры <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ Quiz Configurator ============
function Quiz() {
  const Q = window.IH_DATA.quiz;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const choose = (idx) => {
    const next = { ...answers, [step]: idx };
    setAnswers(next);
    setTimeout(() => { if (step < Q.length - 1) setStep(step + 1); }, 180);
  };

  const labels = ['Стиль поездки', 'Длительность', 'Размер группы', 'Уровень'];
  const basePrice = 120;
  const mult = [0.9, 1.1, 1.25, 1.45]; // example by comfort
  const durMult = [0.6, 1, 1.4, 1.8];
  const paxMult = [1, 1, 0.85, 0.75];
  const styleMult = [0.95, 1.0, 1.15, 1.3];
  const priceK = Math.round(
    basePrice *
    (styleMult[answers[0] ?? 1]) *
    (durMult[answers[1] ?? 1]) *
    (paxMult[answers[2] ?? 1]) *
    (mult[answers[3] ?? 2])
  );

  const cur = Q[step];

  return (
    <section className="section" id="quiz">
      <div className="wrap">
        <div className="section-label">05 · Configurator</div>
        <div className="section-head">
          <h2 className="section-title">
            Квиз-конструктор <em>твоего</em><br/>маршрута.
          </h2>
          <div className="right">
            4 вопроса — и вы получите индивидуальную ценовую вилку и рекомендованный
            сценарий поездки. Без обязательств.
          </div>
        </div>

        <div className="quiz">
          <div className="quiz-left">
            <div>
              <div className="quiz-progress">
                {Q.map((_, i) => (
                  <div key={i} className={`quiz-progress-bar ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`} />
                ))}
              </div>
              <div className="quiz-step-label">Шаг {step + 1} / {Q.length} · {labels[step]}</div>
              <h3 className="quiz-question">{cur.q.split(' ').map((w, i) =>
                i === 2 ? <em key={i}>{w} </em> : <span key={i}>{w} </span>
              )}</h3>
              <p className="quiz-hint">{cur.hint}</p>
              <div className="quiz-options">
                {cur.opts.map((o, idx) => (
                  <button key={o.k}
                          className={`quiz-opt ${answers[step] === idx ? 'selected' : ''}`}
                          onClick={() => choose(idx)}>
                    <div className="k">{o.k}</div>
                    <div className="quiz-opt-title">{o.t}</div>
                    <div className="quiz-opt-desc">{o.d}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="quiz-nav">
              <button className="btn btn-ghost"
                      onClick={() => setStep(Math.max(0, step - 1))}
                      disabled={step === 0}>
                ← Назад
              </button>
              <Magnetic strength={0.3}>
                <button className="btn btn-primary"
                        onClick={() => step < Q.length - 1 ? setStep(step + 1) : null}>
                  {step < Q.length - 1 ? 'Дальше' : 'Готово'}
                  <span className="arrow">→</span>
                </button>
              </Magnetic>
            </div>
          </div>
          <div className="quiz-right">
            <div>
              <div className="quiz-preview-title">Превью маршрута ·  Live</div>
              <div className="quiz-summary">
                {Q.map((q, i) => (
                  <div key={i} className="quiz-summary-row">
                    <div className="quiz-summary-lbl">{labels[i]}</div>
                    <div className="quiz-summary-val">
                      {answers[i] != null
                        ? <><em>{q.opts[answers[i]].t}</em></>
                        : <span style={{color:'var(--ink-mute)'}}>—</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="quiz-price-block">
              <div className="quiz-preview-title" style={{margin:0, marginBottom:10}}>Ценовая вилка</div>
              <div className="quiz-price-big">
                <em>{priceK}</em>к<span style={{fontFamily:'Playfair Display, serif', fontStyle:'normal'}}> ₽</span>
                <span style={{fontSize:28, color:'var(--ink-dim)', fontStyle:'normal'}}> – {Math.round(priceK*1.4)}к ₽</span>
              </div>
              <div className="quiz-price-meta">за человека · все включено · +персональный менеджер</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Destinations, Tours, Quiz });
