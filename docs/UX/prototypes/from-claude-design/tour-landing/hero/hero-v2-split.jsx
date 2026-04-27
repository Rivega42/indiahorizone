// Hero V2 — Split editorial (Original Travel × Pelorus)
// Композит: 55/45 split, слева — типографика+метаданные на sand-фоне,
// справа — фото-mosaic из 3 кадров. Saffron акцент только в eyebrow + CTA.

const HeroV2 = () => {
  return (
    <div style={{
      width: 1440, height: 900, position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontFeatureSettings: "'cv11','ss01'",
      background: 'hsl(28 30% 96%)',
      color: 'hsl(195 35% 12%)',
      display: 'grid', gridTemplateColumns: '55fr 45fr',
    }}>
      {/* TOP NAV — overlays full width */}
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
          }} />
          IndiaHorizone
        </div>
        <nav style={{ display: 'flex', gap: 32, fontSize: 14, fontWeight: 500, color: 'hsl(195 35% 25%)' }}>
          <a style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>Направления</a>
          <a style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>Подход</a>
          <a style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>Истории</a>
          <a style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>Контакт</a>
        </nav>
        <button style={{
          background: 'hsl(195 35% 12%)', border: 'none', color: '#fff',
          padding: '10px 18px', borderRadius: 999,
          fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
        }}>
          Войти
        </button>
      </header>

      {/* LEFT — typographic side */}
      <div style={{
        padding: '180px 64px 80px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div>
          {/* eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
            <div style={{ width: 36, height: 1, background: 'hsl(24 95% 53%)' }} />
            <div style={{
              fontSize: 12, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'hsl(24 95% 38%)',
            }}>
              Южная Индия · Керала
            </div>
          </div>

          {/* HEADLINE */}
          <h1 style={{
            fontSize: 76, lineHeight: 1.0, letterSpacing: '-0.035em',
            fontWeight: 600, margin: 0, color: 'hsl(195 35% 10%)',
            textWrap: 'balance',
          }}>
            Двенадцать дней<br/>
            между чаем,<br/>
            водой и тишиной.
          </h1>

          <p style={{
            fontSize: 17, lineHeight: 1.6, marginTop: 32, maxWidth: 480,
            color: 'hsl(195 25% 30%)', fontWeight: 400,
          }}>
            Маршрут от Муннара до Аллеппи, без туристических автобусов
            и обязательных программ. Концирж-команда в Telegram, лодочник
            знает вас по имени, домой — со своими историями, а не сувенирами.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 44 }}>
            <button style={{
              background: 'hsl(195 35% 12%)', color: '#fff', border: 'none',
              padding: '16px 32px', borderRadius: 999, fontSize: 15, fontWeight: 500,
              fontFamily: 'inherit', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 10,
            }}>
              Спланировать маршрут
              <span>→</span>
            </button>
            <a style={{
              color: 'hsl(195 35% 25%)', fontSize: 14, fontWeight: 500,
              textDecoration: 'none', cursor: 'pointer',
              borderBottom: '1px dashed hsl(195 25% 50%)',
              paddingBottom: 4,
            }}>
              Программа по дням
            </a>
          </div>
        </div>

        {/* META row — bottom */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28,
          paddingTop: 32, borderTop: '1px solid hsl(195 15% 85%)',
        }}>
          <FactL label="Длительность" value="12 дн" />
          <FactL label="Группа" value="2–6 чел" />
          <FactL label="Сезон" value="Окт–Мар" />
          <FactL label="От" value="₽ 285k / чел" accent />
        </div>
      </div>

      {/* RIGHT — photo mosaic */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        display: 'grid', gridTemplateRows: '1.4fr 1fr', gap: 8, padding: 8,
      }}>
        {/* Big top photo — backwaters */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 4,
          background: 'linear-gradient(180deg, hsl(28 70% 55%) 0%, hsl(160 35% 30%) 60%, hsl(195 40% 18%) 100%)',
        }}>
          <img
            src="https://images.pexels.com/photos/3601442/pexels-photo-3601442.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Kerala backwaters"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(1.1) contrast(1.04)' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div style={{
            position: 'absolute', left: 16, bottom: 14,
            color: '#fff', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}>
            Backwaters · Аллеппи
          </div>
        </div>

        {/* Bottom row — 2 photos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 4,
            background: 'linear-gradient(160deg, hsl(140 50% 50%) 0%, hsl(160 45% 25%) 100%)',
          }}>
            <img
              src="https://images.pexels.com/photos/4666749/pexels-photo-4666749.jpeg?auto=compress&cs=tinysrgb&w=1000"
              alt="Munnar tea"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(1.15)' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div style={{
              position: 'absolute', left: 14, bottom: 12,
              color: '#fff', fontSize: 10, fontWeight: 500,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}>
              Чай · Муннар
            </div>
          </div>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 4,
            background: 'linear-gradient(160deg, hsl(15 80% 50%) 0%, hsl(28 75% 40%) 100%)',
          }}>
            <img
              src="https://images.pexels.com/photos/4916559/pexels-photo-4916559.jpeg?auto=compress&cs=tinysrgb&w=1000"
              alt="Spice market"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(1.2) contrast(1.05)' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div style={{
              position: 'absolute', left: 14, bottom: 12,
              color: '#fff', fontSize: 10, fontWeight: 500,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}>
              Специи · Кочи
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FactL = ({ label, value, accent }) => (
  <div>
    <div style={{
      fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
      color: 'hsl(195 15% 50%)', marginBottom: 6,
    }}>{label}</div>
    <div style={{
      fontSize: 16, fontWeight: 600,
      color: accent ? 'hsl(24 95% 38%)' : 'hsl(195 35% 15%)',
    }}>{value}</div>
  </div>
);

window.HeroV2 = HeroV2;
