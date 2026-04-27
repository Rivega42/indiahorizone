// Hero V3 — Immersive saffron sunset (Much Better Adventures × Black Tomato)
// Композит: full-bleed закатное фото + saffron-tinted overlay, headline
// сдвинут влево-низ, бейдж "Hand-picked" сверху, плавающая карточка "Why now".
// Самый "сочный" вариант — с двойной проявкой saffron.

const HeroV3 = () => {
  return (
    <div style={{
      width: 1440, height: 900, position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontFeatureSettings: "'cv11','ss01'",
      background: '#000',
      color: '#fff',
    }}>
      {/* HERO IMAGE — Kerala houseboat sunset (gradient fallback + photo overlay) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 70% 35%, hsl(28 95% 60%) 0%, hsl(20 85% 45%) 25%, hsl(15 60% 25%) 60%, hsl(195 40% 12%) 100%)',
      }} />
      <img
        src="https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=2400"
        alt="Kerala sunset over backwaters"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', filter: 'saturate(1.15) contrast(1.05)',
        }}
        onError={(e) => {
          if (!e.currentTarget.dataset.tried) {
            e.currentTarget.dataset.tried = '1';
            e.currentTarget.src = 'https://images.pexels.com/photos/3601442/pexels-photo-3601442.jpeg?auto=compress&cs=tinysrgb&w=2400';
          } else { e.currentTarget.style.display = 'none'; }
        }}
      />

      {/* Saffron warmth overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 70% 35%, hsla(24, 95%, 53%, 0.35) 0%, transparent 50%), linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.65) 85%, rgba(0,0,0,0.9) 100%)',
        mixBlendMode: 'normal',
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
            boxShadow: '0 0 20px hsla(24, 95%, 53%, 0.5)',
          }} />
          IndiaHorizone
        </div>
        <nav style={{ display: 'flex', gap: 32, fontSize: 14, fontWeight: 500 }}>
          <a style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.92)', cursor: 'pointer' }}>Направления</a>
          <a style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.92)', cursor: 'pointer' }}>Подход</a>
          <a style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.92)', cursor: 'pointer' }}>Истории</a>
          <a style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.92)', cursor: 'pointer' }}>Контакт</a>
        </nav>
        <button style={{
          background: 'hsl(24 95% 53%)', border: 'none', color: '#fff',
          padding: '10px 20px', borderRadius: 999,
          fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
          boxShadow: '0 4px 20px hsla(24, 95%, 53%, 0.4)',
        }}>
          Узнать стоимость
        </button>
      </header>

      {/* HAND-PICKED BADGE — top center */}
      <div style={{
        position: 'absolute', top: 110, left: 56, zIndex: 5,
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '8px 16px 8px 10px', borderRadius: 999,
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.18)',
        fontSize: 12, fontWeight: 500, letterSpacing: '0.04em',
      }}>
        <span style={{
          display: 'inline-block', width: 20, height: 20, borderRadius: '50%',
          background: 'hsl(24 95% 53%)',
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.25)',
          fontSize: 11, lineHeight: '20px', textAlign: 'center', fontWeight: 700,
        }}>★</span>
        Hand-picked · собрано вручную для 6 человек в год
      </div>

      {/* HEADLINE — bottom left */}
      <div style={{
        position: 'absolute', left: 56, bottom: 130, zIndex: 5,
        maxWidth: 880,
      }}>
        <div style={{
          fontSize: 13, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'hsl(24 95% 75%)', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span>Южная Индия</span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'hsl(24 95% 65%)' }} />
          <span>Керала</span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'hsl(24 95% 65%)' }} />
          <span>10 дней / 9 ночей</span>
        </div>
        <h1 style={{
          fontSize: 104, lineHeight: 0.95, letterSpacing: '-0.04em',
          fontWeight: 600, margin: 0,
          textWrap: 'balance',
        }}>
          <span style={{
            background: 'linear-gradient(180deg, hsl(28 100% 78%) 0%, hsl(24 95% 60%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontStyle: 'italic', fontWeight: 500,
          }}>Керала</span> —<br/>
          <span style={{ fontWeight: 500 }}>без спешки,</span><br/>
          <span style={{ fontWeight: 500 }}>без автобусов,</span><br/>
          <span style={{ opacity: 0.9, fontWeight: 400 }}>без обязательных селфи.</span>
        </h1>

        {/* CTA cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 40 }}>
          <button style={{
            background: 'hsl(24 95% 53%)', color: '#fff', border: 'none',
            padding: '18px 36px', borderRadius: 999, fontSize: 16, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 12,
            boxShadow: '0 8px 32px hsla(24, 95%, 53%, 0.45)',
          }}>
            Спланировать маршрут
            <span style={{ fontSize: 18 }}>→</span>
          </button>
          <a style={{
            color: '#fff', fontSize: 15, fontWeight: 500,
            textDecoration: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            opacity: 0.85,
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.4)',
            }}>▶</span>
            Смотреть фильм · 1:24
          </a>
        </div>
      </div>

      {/* WHY NOW — floating card right */}
      <div style={{
        position: 'absolute', right: 56, bottom: 130, zIndex: 5,
        width: 280,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: '20px 22px',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'hsl(24 95% 75%)', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(24 95% 53%)', boxShadow: '0 0 8px hsla(24, 95%, 53%, 0.8)' }} />
          Почему сейчас
        </div>
        <p style={{
          fontSize: 14, lineHeight: 1.5, margin: 0,
          color: 'rgba(255,255,255,0.92)',
        }}>
          Сезон муссонов кончился, чайные склоны на пике зелени,
          вода в backwaters — самая чистая за год. Окно — до конца марта.
        </p>
        <div style={{
          marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>От</span>
          <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: 'hsl(24 95% 75%)' }}>₽ 285 000</span>
        </div>
      </div>

      {/* SCROLL HINT */}
      <div style={{
        position: 'absolute', left: '50%', bottom: 32, transform: 'translateX(-50%)',
        fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column',
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

window.HeroV3 = HeroV3;
