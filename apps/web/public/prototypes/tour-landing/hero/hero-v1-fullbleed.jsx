// Hero V1 — Full-bleed cinematic (Black Tomato style)
// Композит: одно героическое фото на всю ширину, тёмный gradient снизу,
// тонкий headline в стиле "отрицанием", CTA — текстовая ссылка с saffron-подчёркиванием.

const HeroV1 = () => {
  const ref = React.useRef(null);
  const [scrolled, setScrolled] = React.useState(false);

  return (
    <div ref={ref} style={{
      width: 1440, height: 900, position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontFeatureSettings: "'cv11','ss01'",
      background: '#000',
      color: '#fff',
    }}>
      {/* HERO IMAGE — Kerala backwaters (Pexels CDN, stable) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, hsl(28 70% 55%) 0%, hsl(28 60% 45%) 30%, hsl(160 35% 30%) 65%, hsl(195 40% 18%) 100%)',
      }} />
      <img
        src="https://images.pexels.com/photos/3601442/pexels-photo-3601442.jpeg?auto=compress&cs=tinysrgb&w=2400"
        alt="Kerala backwaters"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', filter: 'saturate(1.1) contrast(1.04)',
        }}
        onError={(e) => {
          if (!e.currentTarget.dataset.tried) {
            e.currentTarget.dataset.tried = '1';
            e.currentTarget.src = 'https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=2400';
          } else if (e.currentTarget.dataset.tried === '1') {
            e.currentTarget.dataset.tried = '2';
            e.currentTarget.src = 'https://images.pexels.com/photos/19897059/pexels-photo-19897059.jpeg?auto=compress&cs=tinysrgb&w=2400';
          } else {
            e.currentTarget.style.display = 'none';
          }
        }}
      />

      {/* Gradient overlay — dark bottom + slight top vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.85) 100%)',
      }} />

      {/* TOP NAV */}
      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '28px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontWeight: 600, fontSize: 18, letterSpacing: '-0.01em',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            display: 'inline-block', width: 28, height: 28, borderRadius: 6,
            background: 'hsl(24 95% 53%)',
            boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.15)',
          }} />
          IndiaHorizone
        </div>
        <nav style={{ display: 'flex', gap: 32, fontSize: 14, fontWeight: 500, opacity: 0.9 }}>
          <a style={navLink}>Направления</a>
          <a style={navLink}>Подход</a>
          <a style={navLink}>Истории</a>
          <a style={navLink}>Контакт</a>
        </nav>
        <button style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.35)',
          color: '#fff', padding: '10px 18px', borderRadius: 999,
          fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}>
          Войти
        </button>
      </header>

      {/* EYEBROW (top-left under nav) */}
      <div style={{
        position: 'absolute', top: 110, left: 56, zIndex: 5,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ width: 36, height: 1, background: 'hsl(24 95% 65%)' }} />
        <div style={{
          fontSize: 12, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'hsl(24 95% 75%)',
        }}>
          Южная Индия · Керала · 12 дней
        </div>
      </div>

      {/* HEADLINE block — bottom left */}
      <div style={{
        position: 'absolute', left: 56, bottom: 120, zIndex: 5,
        maxWidth: 820,
      }}>
        <h1 style={{
          fontSize: 84, lineHeight: 0.98, letterSpacing: '-0.035em',
          fontWeight: 600, margin: 0,
          textWrap: 'balance',
        }}>
          Керала — без спешки,<br/>
          без автобусов,<br/>
          <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'hsl(28 80% 85%)' }}>
            без обязательных селфи.
          </span>
        </h1>
        <p style={{
          fontSize: 18, lineHeight: 1.55, marginTop: 28, maxWidth: 540,
          color: 'rgba(255,255,255,0.82)', fontWeight: 400,
        }}>
          Двенадцать дней между чайными плантациями Муннара,
          backwaters Аллеппи и тишиной Текади. Маршрут собираем
          под ваш ритм — не под расписание группы.
        </p>

        {/* CTA cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 40 }}>
          <a style={{
            color: '#fff', fontSize: 16, fontWeight: 500,
            textDecoration: 'none',
            borderBottom: '2px solid hsl(24 95% 53%)',
            paddingBottom: 6, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 10,
          }}>
            Спланировать маршрут
            <span style={{ fontSize: 18 }}>→</span>
          </a>
          <a style={{
            color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500,
            textDecoration: 'none', cursor: 'pointer',
          }}>
            Посмотреть программу по дням
          </a>
        </div>
      </div>

      {/* META RIGHT — facts */}
      <div style={{
        position: 'absolute', right: 56, bottom: 120, zIndex: 5,
        display: 'flex', flexDirection: 'column', gap: 22,
        textAlign: 'right',
      }}>
        <Fact label="Длительность" value="12 дней / 11 ночей" />
        <Fact label="Размер группы" value="2–6 человек" />
        <Fact label="Сезон" value="Окт — Март" />
        <Fact label="От" value="₽ 285 000 / чел." accent />
      </div>

      {/* SCROLL HINT */}
      <div style={{
        position: 'absolute', left: '50%', bottom: 32, transform: 'translateX(-50%)',
        fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.55)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 10,
      }}>
        Программа по дням
        <div style={{
          width: 1, height: 28, background: 'linear-gradient(180deg, rgba(255,255,255,0.6), transparent)',
        }} />
      </div>
    </div>
  );
};

const navLink = {
  color: 'rgba(255,255,255,0.92)', textDecoration: 'none', cursor: 'pointer',
};

const Fact = ({ label, value, accent }) => (
  <div>
    <div style={{
      fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.55)', marginBottom: 6,
    }}>{label}</div>
    <div style={{
      fontSize: accent ? 22 : 16, fontWeight: accent ? 600 : 500,
      letterSpacing: accent ? '-0.01em' : 0,
      color: accent ? 'hsl(24 95% 70%)' : '#fff',
    }}>{value}</div>
  </div>
);

window.HeroV1 = HeroV1;
