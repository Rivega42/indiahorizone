// ============ For Whom · 3 personas ============
function ForWhom() {
  const personas = [
    {
      id: 'leader', tag: '01 · Для руководителя',
      title: 'Вы — руководитель',
      hook: 'Вам нужен отдых, где не нужно думать',
      body: 'Прилёт — сразу в номер с балконом на океан. Встреча в аэропорту, SIM с интернетом, трансферы, водитель 24/7, врач на связи. Любое решение — за 10 минут в Telegram.',
      stats: [
        { v: '0 мин', l: 'ожидания в аэропорту' },
        { v: '5★', l: 'только верифицированные отели' },
        { v: '24/7', l: 'личный менеджер' },
      ],
      img: 'https://images.unsplash.com/photo-1578528178125-6e21f67a7c8f?w=900&q=80',
    },
    {
      id: 'researcher', tag: '02 · Для исследователя',
      title: 'Вы — исследователь',
      hook: 'Вам важно понять страну, а не посмотреть открытки',
      body: 'Гиды с PhD по индологии, встречи с местными мастерами, дом в деревне вместо отеля, рецепты от бабушек, ночёвка в дхарме у настоящего садху. Опыт, который не купить в агрегаторах.',
      stats: [
        { v: '14', l: 'штатных гидов-индологов' },
        { v: '40+', l: 'локальных партнёров' },
        { v: '6 лет', l: 'работы с местными' },
      ],
      img: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=900&q=80',
    },
    {
      id: 'seeker', tag: '03 · В поиске себя',
      title: 'Вы — в поиске себя',
      hook: 'Индия — это перезагрузка, а не отпуск',
      body: 'Ретриты в Ришикеше и Ауровиле, випассана 10 дней, аюрведический Панчакарма, учителя йоги с линией передачи, тишина Гималаев. Мы проверили каждое место лично.',
      stats: [
        { v: '10 дней', l: 'минимум для перезагрузки' },
        { v: '7', l: 'проверенных ашрамов' },
        { v: '100%', l: 'гарантия замены отеля' },
      ],
      img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=900&q=80',
    },
  ];
  const [active, setActive] = React.useState('leader');
  const p = personas.find(x => x.id === active);
  return (
    <section className="section" id="forwhom">
      <div className="wrap">
        <div className="section-label">09 · Для кого</div>
        <div className="section-head">
          <h2 className="section-title">
            Три способа <em>увидеть</em> Индию.<br/>
            Какой ваш?
          </h2>
          <div className="right">
            Мы не продаём «туры для всех». За шесть лет мы поняли: в Индию едут за тремя разными вещами.
            Выберите себя — и мы покажем сценарий.
          </div>
        </div>
        <div className="fw-tabs">
          {personas.map(x => (
            <button key={x.id}
              className={`fw-tab ${active === x.id ? 'active' : ''}`}
              onClick={() => setActive(x.id)}>
              <span className="fw-tab-num">{x.tag.split(' · ')[0]}</span>
              <span className="fw-tab-title">{x.title}</span>
            </button>
          ))}
        </div>
        <div className="fw-body glass">
          <div className="fw-visual"
            style={{backgroundImage:`url(${p.img})`}}>
            <div className="fw-visual-overlay" />
            <div className="fw-visual-tag">{p.tag}</div>
          </div>
          <div className="fw-text">
            <div className="fw-hook">{p.hook}</div>
            <p className="fw-desc">{p.body}</p>
            <div className="fw-stats">
              {p.stats.map((s, i) => (
                <div className="fw-stat" key={i}>
                  <div className="fw-stat-v">{s.v}</div>
                  <div className="fw-stat-l">{s.l}</div>
                </div>
              ))}
            </div>
            <a href="#booking" className="btn-primary fw-cta">
              <span>Обсудить сценарий</span>
              <span className="arr">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ Trusted By · social proof ============
function TrustedBy() {
  const companies = [
    'ЯНДЕКС', 'SBER', 'VK', 'TINKOFF', 'AVITO', 'OZON',
    'МТС', 'WILDBERRIES', 'ВТБ', 'Skyeng', 'S7', 'ALFA',
  ];
  return (
    <section className="trusted-section">
      <div className="wrap">
        <div className="trusted-head">
          <div className="section-label">Social proof</div>
          <h3 className="trusted-title">
            Нам доверяют сотрудники компаний
          </h3>
          <p className="trusted-sub">
            За 6 лет мы отправили в Индию более 2 400 человек из команд, где на детали смотрят внимательно.
          </p>
        </div>
        <div className="trusted-grid">
          {companies.map((c, i) => (
            <div key={i} className="trusted-logo">
              <span>{c}</span>
            </div>
          ))}
        </div>
        <div className="trusted-meta">
          <div><span className="trusted-num">2 400+</span><span>клиентов</span></div>
          <div><span className="trusted-num">98%</span><span>вернулись повторно</span></div>
          <div><span className="trusted-num">4.97</span><span>средняя оценка</span></div>
        </div>
      </div>
    </section>
  );
}

// ============ Video Testimonial ============
function VideoReview() {
  const [playing, setPlaying] = React.useState(false);
  return (
    <section className="section" id="video-review">
      <div className="wrap">
        <div className="section-label">10 · Видео-отзыв</div>
        <div className="vr-wrap glass">
          <div className="vr-video"
            style={{backgroundImage: 'url(https://images.unsplash.com/photo-1580489944761-15a19d654956?w=1400&q=80)'}}>
            <div className="vr-overlay" />
            <button className="vr-play"
              onClick={() => setPlaying(p => !p)}
              aria-label={playing ? 'Пауза' : 'Воспроизвести'}>
              {playing
                ? <svg width="22" height="28" viewBox="0 0 22 28"><rect x="2" y="2" width="6" height="24" fill="currentColor"/><rect x="14" y="2" width="6" height="24" fill="currentColor"/></svg>
                : <svg width="24" height="28" viewBox="0 0 24 28"><polygon points="4,2 4,26 22,14" fill="currentColor"/></svg>
              }
            </button>
            <div className="vr-timeline">
              <div className="vr-bar">
                <div className="vr-progress" style={{width: playing ? '34%' : '0%'}} />
              </div>
              <div className="vr-time">{playing ? '00:31' : '00:00'} / 01:28</div>
            </div>
          </div>
          <div className="vr-meta">
            <div className="vr-tag">История клиента · 90 секунд</div>
            <h3 className="vr-title">
              «Я боялась хаоса. Вернулась с&nbsp;другой жизнью»
            </h3>
            <p className="vr-desc">
              Елена, 52, директор по маркетингу. Первая поездка в Индию —
              Керала и Ришикеш, 14 дней. Рассказывает, чего реально ожидала,
              что удивило и почему уже забронировала вторую поездку.
            </p>
            <div className="vr-client">
              <div className="vr-avatar"
                style={{backgroundImage:'url(https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80)'}}/>
              <div>
                <div className="vr-name">Елена К.</div>
                <div className="vr-role">Директор по маркетингу · Москва</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ FAQ Safety + Packing ============
function FAQ() {
  const faqs = [
    { q: 'Безопасно ли ехать в Индию в 2026?', a: 'Да, для туристических регионов (Гоа, Керала, Раджастан, Гималаи). Мы работаем только в проверенных местах, избегаем зон с предупреждениями МИД. Все наши водители с опытом 5+ лет, у каждого — страховка пассажира.' },
    { q: 'Что с едой? Боюсь отравиться', a: 'В ресторанах нашего уровня (4★+) это безопасно — мы проверяем кухню лично. Вода — только бутилированная, сразу даём запас в машину. На маршрутах вне туристических зон готовим на нашей стороне или едим в семьях-партнёрах.' },
    { q: 'Нужны ли прививки?', a: 'Обязательных нет. Рекомендуем гепатит А и брюшной тиф (безопасность ⨯ стоит 2–3 тыс ₽). Малярия только для Сундарбана и некоторых северо-восточных штатов — мы туда не возим.' },
    { q: 'Что взять с собой?', a: 'Лёгкая хлопковая одежда, закрытая для храмов (длинный рукав, юбка/штаны ниже колена), солнцезащитный крем 50+, антисептик для рук, средство от диареи на всякий случай. Всё остальное — аптечка, шлёпки, адаптер — в welcome-kit, который ждёт в номере.' },
    { q: 'Вы берёте с детьми?', a: 'С 6 лет — да. Керала, Гоа, часть Раджастана — отлично для семей. Гималаи и интенсивные ретриты не рекомендуем. Для семей есть отдельные сценарии со ступенчатым ритмом.' },
    { q: 'Что если заболею в поездке?', a: 'В welcome-kit аптечка на 80% случаев. У нас договор с 3 международными клиниками (Дели, Мумбаи, Коччи), менеджер вызывает врача к вам в номер. Страховка Allianz/Tripinsurance включена в цену от «Комфорт».' },
    { q: 'Какая разница с туроператорами?', a: 'Мы — консьерж, не турагент. Не продаём пакеты. Изучаем вас, собираем сценарий, ведём в поездке. Это в 1.6–2.2 раза дороже массового тура и в 3 раза дешевле частного концергжа «с нуля».' },
    { q: 'А если мне не понравится?', a: 'Первые 72 часа — гарантия замены отеля или маршрута за наш счёт. После — пересогласуем. За 6 лет у нас 11 таких случаев из 2 400 клиентов.' },
  ];
  const [open, setOpen] = React.useState(0);
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <div className="section-label">11 · FAQ</div>
        <div className="section-head">
          <h2 className="section-title">
            Восемь вопросов, которые<br/>
            <em>задают всегда</em>.
          </h2>
          <div className="right">
            Большинство страхов — про еду, безопасность и «а вдруг что». Отвечаем честно:
            что делаем, чего не делаем, и что лежит в welcome-kit.
          </div>
        </div>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <div key={i} className={`faq-item ${open === i ? 'open' : ''}`}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span className="faq-num">{String(i+1).padStart(2, '0')}</span>
                <span className="faq-text">{f.q}</span>
                <span className="faq-toggle">{open === i ? '−' : '+'}</span>
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">{f.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { ForWhom, TrustedBy, VideoReview, FAQ });
