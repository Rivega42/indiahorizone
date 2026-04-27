// Hero Mobile — 375px (Much Better Adventures style)
// Sticky CTA снизу, hero ~70vh, headline сжат

const HeroMobile = () => {
  return (
    <div style={{
      width: 375, height: 812, position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontFeatureSettings: "'cv11','ss01'",
      background: '#000', color: '#fff',
      borderRadius: 0,
    }}>
      {/* HERO image — 70vh */}
      <div style={{ position: 'relative', height: 568, overflow: 'hidden',
        background: 'radial-gradient(ellipse at 70% 35%, hsl(28 95% 60%) 0%, hsl(20 85% 45%) 25%, hsl(15 60% 25%) 60%, hsl(195 40% 12%) 100%)',
      }}>
        <img
          src="https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Kerala"
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.15) contrast(1.05)' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 70% 35%, hsla(24, 95%, 53%, 0.3) 0%, transparent 55%), linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 30%, rgba(0,0,0,0.7) 100%)',
        }} />

        {/* Top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
          padding: '50px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-block', width: 24, height: 24, borderRadius: 5,
              background: 'hsl(24 95% 53%)',
            }} />
            IndiaHorizone
          </div>
          <button style={{
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
            width: 36, height: 36, color: '#fff', fontSize: 18, cursor: 'pointer',
          }}>☰</button>
        </div>

        {/* Eyebrow */}
        <div style={{
          position: 'absolute', top: 110, left: 20, right: 20, zIndex: 5,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px 6px 8px', borderRadius: 999,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: 'hsl(24 95% 53%)',
            }} />
            Hand-picked · 6 человек / год
          </div>
        </div>

        {/* Headline bottom */}
        <div style={{
          position: 'absolute', bottom: 28, left: 20, right: 20, zIndex: 5,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'hsl(24 95% 75%)', marginBottom: 12,
          }}>
            Керала · 12 дней
          </div>
          <h1 style={{
            fontSize: 38, lineHeight: 1.0, letterSpacing: '-0.03em',
            fontWeight: 600, margin: 0,
            textWrap: 'balance',
          }}>
            Закат на <span style={{ color: 'hsl(28 95% 75%)', fontStyle: 'italic', fontWeight: 500 }}>backwaters</span>,<br/>
            а не у фонтана.
          </h1>
          <p style={{
            fontSize: 14, lineHeight: 1.5, marginTop: 14, maxWidth: 320,
            color: 'rgba(255,255,255,0.82)', fontWeight: 400,
          }}>
            Двенадцать дней между чаем Муннара и тишиной Текади.
            Без автобусов, под ваш ритм.
          </p>
        </div>
      </div>

      {/* Below-fold preview */}
      <div style={{
        padding: '24px 20px',
        background: 'hsl(195 35% 10%)',
        height: 244,
        position: 'relative',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <FactM label="Длит." value="12 дн" />
          <FactM label="Группа" value="2–6" />
          <FactM label="Сезон" value="Окт–Мар" />
          <FactM label="От" value="₽285k" accent />
        </div>
        <div style={{
          marginTop: 18, fontSize: 13, lineHeight: 1.5,
          color: 'rgba(255,255,255,0.7)',
        }}>
          Сезон муссонов кончился, чайные склоны — на пике зелени.
          Окно — до конца марта.
        </div>
      </div>

      {/* Sticky CTA bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 16px 28px',
        background: 'linear-gradient(180deg, transparent 0%, hsl(195 35% 8%) 30%)',
        display: 'flex', gap: 10, zIndex: 20,
      }}>
        <button style={{
          flex: 1,
          background: 'hsl(24 95% 53%)', color: '#fff', border: 'none',
          padding: '16px', borderRadius: 12, fontSize: 15, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer',
          boxShadow: '0 8px 24px hsla(24, 95%, 53%, 0.45)',
        }}>
          Узнать стоимость
        </button>
        <button style={{
          width: 56,
          background: 'rgba(255,255,255,0.1)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '16px', borderRadius: 12, fontSize: 18,
          fontFamily: 'inherit', cursor: 'pointer',
        }}>♡</button>
      </div>
    </div>
  );
};

const FactM = ({ label, value, accent }) => (
  <div>
    <div style={{
      fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.5)', marginBottom: 4,
    }}>{label}</div>
    <div style={{
      fontSize: 14, fontWeight: 600,
      color: accent ? 'hsl(24 95% 70%)' : '#fff',
    }}>{value}</div>
  </div>
);

window.HeroMobile = HeroMobile;
