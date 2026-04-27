// ============ Liquid Cursor ============
const { useState, useEffect, useRef, useMemo } = React;

function LiquidCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let dx = mx, dy = my;      // dot (fast follow)
    let rx = mx, ry = my;      // ring (lagging)
    let raf;

    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    const onOver = (e) => {
      const t = e.target;
      if (t && t.closest && t.closest('a, button, .chip, .quiz-opt, .tour, .dest, .guide, .article, [data-hover]')) {
        setHover(true);
      }
    };
    const onOut = () => setHover(false);

    const tick = () => {
      dx += (mx - dx) * 0.35;
      dy += (my - dy) * 0.35;
      rx += (mx - rx) * 0.28;
      ry += (my - ry) * 0.28;
      if (dotRef.current) dotRef.current.style.transform = `translate(${dx - 3}px, ${dy - 3}px)`;
      if (ringRef.current) ringRef.current.style.transform = `translate(${rx - 24}px, ${ry - 24}px)`;
      raf = requestAnimationFrame(tick);
    };
    tick();

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    window.addEventListener('mouseout', onOut);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mouseout', onOut);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className={`cursor-ring ${hover ? 'hover' : ''}`} />
    </>
  );
}

// ============ Magnetic Button wrapper ============
function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    };
    const onLeave = () => { el.style.transform = 'translate(0,0)'; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [strength]);
  return <span ref={ref} className={`magnetic ${className}`}>{children}</span>;
}

// ============ Atmosphere ============
function Atmosphere() {
  return (
    <div className="atmosphere">
      <div className="blob-3" />
      <div className="grain" />
    </div>
  );
}

// ============ SVG Liquid Filter ============
function LiquidFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <filter id="liquid-distortion">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="5" />
          <feDisplacementMap in="SourceGraphic" scale="14" />
        </filter>
        <filter id="goo">
          <feGaussianBlur stdDeviation="10" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" />
        </filter>
      </defs>
    </svg>
  );
}

// ============ Nav ============
function Nav() {
  const [active, setActive] = useState('Главная');
  const items = [
    { en: 'Главная', href: 'home' },
    { en: 'Направления', href: 'direction' },
    { en: 'Туры', href: 'tours' },
    { en: 'Карта', href: 'map' },
    { en: 'Журнал', href: 'blog' },
    { en: 'Контакты', href: 'contacts' },
  ];
  return (
    <nav className="nav">
      <div className="nav-logo">
        <div className="nav-logo-mark" />
        <div className="nav-logo-text">India <em>Horizone</em></div>
      </div>
      <div className="nav-links">
        {items.map((it) => (
          <a key={it.en} href={`#${it.href}`}
             className={`nav-link ${active === it.en ? 'active' : ''}`}
             onClick={() => setActive(it.en)}>
            {it.en}
          </a>
        ))}
      </div>
      <Magnetic strength={0.2}>
        <a className="nav-link nav-cta" href="#booking">Забронировать</a>
      </Magnetic>
    </nav>
  );
}

// ============ Hero ============
function Hero() {
  const visualRef = useRef(null);

  useEffect(() => {
    const el = visualRef.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      const cards = el.querySelectorAll('.hero-card');
      cards.forEach((c, i) => {
        // Skip stack cards when one is hovered — let CSS hover transform win
        if (c.classList.contains('hero-card-stack')) {
          if (el.querySelector('.hero-card-stack:hover')) return;
        }
        const depth = [6, 10, 14, 8, 18][i] || 8;
        const baseR = parseFloat(c.dataset.rot || 0);
        const isStack = c.classList.contains('hero-card-stack');
        if (isStack) {
          c.style.transform = `rotate(${baseR}deg) translate3d(${-nx * depth}px, ${-ny * depth}px, 0)`;
        } else {
          c.style.transform = `translate3d(${-nx * depth}px, ${-ny * depth}px, 0) rotate(${baseR}deg)`;
        }
      });
    };
    const onLeave = () => {
      el.querySelectorAll('.hero-card').forEach((c) => { c.style.transform = ''; });
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    // global scroll parallax
    const onScroll = () => {
      const y = window.scrollY;
      document.querySelectorAll('[data-parallax]').forEach((n) => {
        const speed = parseFloat(n.dataset.parallax) || 0.2;
        n.style.transform = `translate3d(0, ${y * speed}px, 0)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <section className="hero" id="home">
      <div className="wrap">
        <div className="hero-layout">
          <div>
            <div className="hero-meta">
              <div className="dot" />
              <div className="eyebrow">Tech-enabled concierge · Mumbai · Moscow</div>
            </div>
            <h1 className="hero-title">
              <span className="line">Индия</span>
              <span className="line"><em>без хаоса.</em></span>
              <span className="line">С характером.</span>
            </h1>
            <p className="hero-sub">
              Tech-enabled concierge для русскоязычных клиентов: персональный маршрут,
              локальная поддержка 24/7 в Индии, сопровождение до, во время и после поездки.
            </p>
            <div className="hero-ctas">
              <Magnetic strength={0.3}>
                <a href="#quiz" className="btn btn-primary">
                  Собрать свой маршрут
                  <span className="arrow">→</span>
                </a>
              </Magnetic>
              <Magnetic strength={0.25}>
                <a href="#tours" className="btn btn-glass">Смотреть туры</a>
              </Magnetic>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-num"><em>2 412</em></div>
                <div className="hero-stat-label">Отправленных путешественников</div>
              </div>
              <div>
                <div className="hero-stat-num"><em>14</em></div>
                <div className="hero-stat-label">Лет в сегменте премиум</div>
              </div>
              <div>
                <div className="hero-stat-num"><em>4.97</em></div>
                <div className="hero-stat-label">Средний рейтинг отзывов</div>
              </div>
            </div>
          </div>

          <div className="hero-visual" ref={visualRef}>
            <a href="#tours" className="hero-card hero-card-stack hero-card-s1" data-rot="-8">
              <div className="hero-card-image" style={{backgroundImage: `url(${window.__resources && window.__resources.img19 ? window.__resources.img19 : "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=900&q=85"})`}} />
              <div className="hero-card-tag">Kerala · Alleppey</div>
              <div className="hero-card-body">
                <h3>Backwaters</h3>
                <div className="meta"><span>10 ночей</span><span>от 124к ₽</span></div>
              </div>
            </a>
            <a href="#tours" className="hero-card hero-card-stack hero-card-s2" data-rot="-2">
              <div className="hero-card-image" style={{backgroundImage: `url(${window.__resources && window.__resources.img20 ? window.__resources.img20 : "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1000&q=85"})`}} />
              <div className="hero-card-tag">Rajasthan · Jaipur</div>
              <div className="hero-card-body">
                <h3>Pink City<br/>Heritage</h3>
                <div className="meta"><span>12 ночей · 5★</span><span>от 198к ₽</span></div>
              </div>
            </a>
            <a href="#tours" className="hero-card hero-card-stack hero-card-s3" data-rot="5">
              <div className="hero-card-image" style={{backgroundImage: `url(${window.__resources && window.__resources.img21 ? window.__resources.img21 : "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1000&q=85"})`}} />
              <div className="hero-card-tag">Ladakh · Leh</div>
              <div className="hero-card-body">
                <h3>Himalaya<br/>High Road</h3>
                <div className="meta"><span>9 ночей</span><span>от 176к ₽</span></div>
              </div>
            </a>
            <a href="#booking" className="hero-card hero-card-float glass glass-strong" data-rot="-3">
              <div className="hero-floating-info">
                <div className="lbl">Ближайший вылет</div>
                <div className="val">28 апр → Дели</div>
                <div className="lbl" style={{marginTop: 6}}>Осталось 3 места</div>
              </div>
            </a>
            <a href="#reviews" className="hero-card hero-card-badge glass glass-strong" data-rot="-8">
              <div className="hero-badge-content">
                <div className="big">4.97<em>★</em></div>
                <div className="small">420 отзывов</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ Ticker ============
function Ticker() {
  const items = [
    { t: 'Goa', faint: false },
    { t: 'The scent of monsoon rain', faint: true },
    { t: 'Kerala', faint: false },
    { t: 'Saffron sunsets over Jaipur', faint: true },
    { t: 'Rajasthan', faint: false },
    { t: 'Echoes of Himalayan temples', faint: true },
    { t: 'Ladakh', faint: false },
    { t: 'Taste of cardamom on the tongue', faint: true },
    { t: 'Varanasi', faint: false },
    { t: 'Midnight aarti on the Ganga', faint: true },
  ];
  const row = (key) => (
    <div className="ticker-track" key={key}>
      {items.concat(items).map((it, i) => (
        <span key={i} className={`ticker-item ${it.faint ? 'faint' : ''}`}>
          <span className="dot" />
          {it.t}
        </span>
      ))}
    </div>
  );
  return <div className="ticker">{row('a')}</div>;
}

Object.assign(window, { LiquidCursor, Magnetic, Atmosphere, LiquidFilter, Nav, Hero, Ticker });
