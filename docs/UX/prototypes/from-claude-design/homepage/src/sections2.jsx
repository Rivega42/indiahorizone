// ============ Reviews ============
function Reviews() {
  const R = window.IH_DATA.reviews;
  return (
    <section className="section" id="reviews">
      <div className="wrap">
        <div className="section-label">06 · Testimonials</div>
        <div className="section-head">
          <h2 className="section-title">
            Слово <em>тех,</em><br/>кто уже вернулся.
          </h2>
          <div className="right">
            Настоящие отзывы без фильтров. Мы публикуем также критику — это
            часть нашего стандарта прозрачности.
          </div>
        </div>
        <div className="reviews">
          {R.map((r, i) => (
            <div key={i} className={`review ${r.accent ? 'accent' : ''}`}>
              <p className="review-quote">
                «{r.quote.split(' ').map((w, j) => j === 1 ? <em key={j}>{w} </em> : <span key={j}>{w} </span>)}»
              </p>
              <div className="review-foot">
                <div className="review-avatar">{r.name[0]}</div>
                <div className="review-meta">
                  <div className="review-name">{r.name}</div>
                  <div className="review-trip">{r.trip}</div>
                </div>
                <div className="review-rating">
                  {Array.from({length: r.rating}).map((_, j) => <div key={j} className="s" />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ Guides ============
function Guides() {
  const G = window.IH_DATA.guides;
  return (
    <section className="section" id="guides">
      <div className="wrap">
        <div className="section-label">07 · Team</div>
        <div className="section-head">
          <h2 className="section-title">
            Гиды, <em>без которых</em><br/>Индия — не та.
          </h2>
          <div className="right">
            Команда из 18 профессионалов в пяти регионах.
            Все проходят ежегодную сертификацию и знают русский.
          </div>
        </div>
        <div className="guides">
          {G.map((g, i) => (
            <div key={i} className="guide">
              <div className="guide-num">0{i+1}</div>
              <div className="guide-ph">
                <div className="ph-image" style={{backgroundImage: `url(${g.img})`, backgroundSize: 'cover', backgroundPosition: 'center'}} />
              </div>
              <div className="guide-body">
                <h3 className="guide-name">{g.name}</h3>
                <div className="guide-role">{g.role}</div>
                <div className="guide-langs">
                  {g.langs.map((l) => <span key={l} className="guide-lang">{l}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ Blog ============
function Blog() {
  const A = window.IH_DATA.articles;
  return (
    <section className="section" id="blog">
      <div className="wrap">
        <div className="section-label">08 · Journal</div>
        <div className="section-head">
          <h2 className="section-title">
            Журнал для <em>готовящихся</em> к Индии.
          </h2>
          <div className="right">
            Длинные статьи от нашей редакции и гидов. Никакого копипаста —
            только личные наблюдения и полевой опыт.
          </div>
        </div>
        <div className="blog">
          {A.map((a, i) => (
            <article key={i} className="article">
              <div className="article-ph">
                <div className="ph-image" style={{backgroundImage: `url(${a.img})`, backgroundSize: 'cover', backgroundPosition: 'center'}} />
              </div>
              <div className="article-body">
                <div className="article-meta">
                  <span className="cat">{a.cat}</span>
                  <span>{a.date}</span>
                  <span>{a.readTime}</span>
                </div>
                <h3 className="article-title">{a.title}</h3>
                <p className="article-excerpt">{a.excerpt}</p>
                <a href="#" className="article-read">Читать <span>→</span></a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ Booking ============
function Booking() {
  const [pax, setPax] = useState(2);
  const [dir, setDir] = useState('rajasthan');
  const [comfort, setComfort] = useState('premium');
  const [date, setDate] = useState('');

  return (
    <section className="section" id="booking">
      <div className="wrap">
        <div className="section-label">09 · Reservation</div>
        <div className="section-head">
          <h2 className="section-title">
            Забронировать <em>персональный</em> маршрут.
          </h2>
          <div className="right">
            После отправки формы с вами свяжется личный менеджер в течение 2 часов.
            Окончательная стоимость фиксируется после согласования.
          </div>
        </div>

        <div className="booking">
          <div className="booking-left">
            <h3>Путешествие <em>начинается</em> с разговора.</h3>
            <p>Мы не бронируем туры по шаблону. Каждый маршрут — диалог, в котором мы узнаём вас и подбираем Индию именно под вас.</p>
            <div className="booking-features">
              <div className="booking-feature">
                <div className="booking-feature-num">01</div>
                <div className="booking-feature-body">
                  <h5>Звонок-знакомство · 40 минут</h5>
                  <p>Менеджер задаёт 30 вопросов, чтобы понять темп, вкус, страхи и ожидания.</p>
                </div>
              </div>
              <div className="booking-feature">
                <div className="booking-feature-num">02</div>
                <div className="booking-feature-body">
                  <h5>Черновик маршрута · 3 дня</h5>
                  <p>Вы получаете 2–3 сценария с гостиницами, графиком и сметой.</p>
                </div>
              </div>
              <div className="booking-feature">
                <div className="booking-feature-num">03</div>
                <div className="booking-feature-body">
                  <h5>Доработка и финализация</h5>
                  <p>Правим, пока не сойдётся всё. Подпись — и мы включаемся в логистику.</p>
                </div>
              </div>
              <div className="booking-feature">
                <div className="booking-feature-num">04</div>
                <div className="booking-feature-body">
                  <h5>Сопровождение 24/7 в поездке</h5>
                  <p>Персональный менеджер в Telegram на весь период вашей Индии.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="booking-form">
            <div className="booking-form-head">
              <div className="booking-form-title">Заявка</div>
              <div className="booking-form-step">Шаг 1 из 2 · Базовые параметры</div>
            </div>

            <div className="field">
              <label>Направление</label>
              <select value={dir} onChange={(e) => setDir(e.target.value)}>
                <option value="rajasthan">Раджастан — Heritage Grand Tour</option>
                <option value="kerala">Керала — Wellness Retreat</option>
                <option value="goa">Гоа — Premium Beach</option>
                <option value="himalaya">Гималаи — Ladakh Odyssey</option>
                <option value="custom">Свой маршрут</option>
              </select>
            </div>

            <div className="field">
              <label>Даты поездки</label>
              <div className="row2">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <select><option>9 дней</option><option>12 дней</option><option>14 дней</option></select>
              </div>
            </div>

            <div className="field">
              <label>Путешественники</label>
              <div className="pax-control">
                <span style={{fontSize: 14}}>Взрослые</span>
                <div style={{display:'flex', gap:12, alignItems:'center'}}>
                  <button className="pax-btn" onClick={() => setPax(Math.max(1, pax-1))}>−</button>
                  <span className="mono" style={{minWidth:20, textAlign:'center'}}>{pax}</span>
                  <button className="pax-btn" onClick={() => setPax(Math.min(10, pax+1))}>+</button>
                </div>
              </div>
            </div>

            <div className="field">
              <label>Уровень комфорта</label>
              <div style={{display:'flex', gap:8}}>
                {['authentic', 'comfort', 'premium', 'private'].map((c) => (
                  <button key={c}
                          className={`chip ${comfort === c ? 'active chip-accent' : ''}`}
                          style={{flex:1, border:'1px solid var(--line-strong)'}}
                          onClick={() => setComfort(c)}>
                    {{authentic:'Auth', comfort:'4★', premium:'5★', private:'Private'}[c]}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Имя · Контакт</label>
              <div className="row2">
                <input placeholder="Ваше имя" />
                <input placeholder="+7 999 000 00 00" />
              </div>
            </div>

            <Magnetic strength={0.25}>
              <button className="btn btn-primary" style={{width:'100%', justifyContent:'center', padding:'16px 22px', marginTop:10}}>
                Отправить заявку
                <span className="arrow">→</span>
              </button>
            </Magnetic>
            <div style={{fontFamily:'JetBrains Mono', fontSize:10, color:'var(--ink-mute)', textAlign:'center', marginTop:14, letterSpacing:'0.14em', textTransform:'uppercase'}}>
              Ответ менеджера в течение 2 часов · без спама
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ Footer ============
function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-big">HORIZONE</div>
        <div className="footer-top">
          <div className="footer-col">
            <div className="nav-logo" style={{padding:0, border:0}}>
              <div className="nav-logo-mark" />
              <div className="nav-logo-text">India <em>Horizone</em></div>
            </div>
            <p className="footer-brand-desc">
              Частная туристическая компания. Москва · Мумбаи · Гоа.
              14 лет отправляем путешественников в Индию, о которой вы не прочтёте в путеводителях.
            </p>
          </div>
          <div className="footer-col">
            <h6>Navigate</h6>
            <a href="#direction">Directions</a>
            <a href="#tours">Tours</a>
            <a href="#map">Map</a>
            <a href="#blog">Journal</a>
          </div>
          <div className="footer-col">
            <h6>Company</h6>
            <a href="#">About</a>
            <a href="#guides">Team</a>
            <a href="#reviews">Reviews</a>
            <a href="#">Press</a>
          </div>
          <div className="footer-col">
            <h6>Contact</h6>
            <a href="#">+7 495 000 00 00</a>
            <a href="#">hello@horizone.in</a>
            <a href="#">Telegram · @horizone</a>
            <a href="#">Instagram · @horizone.in</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© 2012 — 2026 · India Horizone</div>
          <div>Made with care · Mumbai → Moscow</div>
        </div>
      </div>
    </footer>
  );
}

// ============ Tweaks Panel ============
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "saffron",
  "glass": "default"
}/*EDITMODE-END*/;

function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(TWEAK_DEFAULTS.palette);
  const [glass, setGlass] = useState(TWEAK_DEFAULTS.glass);

  useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setOpen(true);
      if (e.data.type === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    document.body.dataset.palette = palette === 'saffron' ? '' : palette;
    if (!palette || palette === 'saffron') delete document.body.dataset.palette;
  }, [palette]);
  useEffect(() => {
    document.body.dataset.glass = glass === 'default' ? '' : glass;
    if (glass === 'default') delete document.body.dataset.glass;
  }, [glass]);

  const send = (edits) => window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');

  const palettes = [
    { id: 'saffron', c: 'linear-gradient(135deg,#ff7a2e,#e0408d)' },
    { id: 'purple', c: 'linear-gradient(135deg,#e91e63,#9c27b0)' },
    { id: 'neon', c: 'linear-gradient(135deg,#ff4d8d,#4d9fff)' },
    { id: 'gold', c: 'linear-gradient(135deg,#d4af37,#c9a961)' },
    { id: 'holographic', c: 'linear-gradient(135deg,#ff006e,#8338ec,#00d9ff)' },
  ];

  return (
    <div className={`tweaks-panel ${open ? 'open' : ''}`}>
      <h4>Tweaks</h4>
      <div className="hint">Включите Tweaks в тулбаре</div>

      <div className="tweaks-group">
        <div className="tweaks-group-title">Палитра</div>
        <div className="tweak-row">
          {palettes.map((p) => (
            <button key={p.id}
                    className={`tweak-swatch ${palette === p.id ? 'on' : ''}`}
                    style={{background: p.c}}
                    onClick={() => { setPalette(p.id); send({ palette: p.id }); }} />
          ))}
        </div>
      </div>

      <div className="tweaks-group">
        <div className="tweaks-group-title">Glass intensity</div>
        <div className="tweak-row">
          {['subtle','default','intense'].map((g) => (
            <button key={g}
                    className={`tweak-pill ${glass === g ? 'on' : ''}`}
                    onClick={() => { setGlass(g); send({ glass: g }); }}>{g}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Reviews, Guides, Blog, Booking, Footer, TweaksPanel });
