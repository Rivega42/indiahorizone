// TripDashboard.jsx — IndiaHorizone Trip Dashboard mobile UI components.
// All visuals follow docs/UX/DESIGN_SYSTEM.md. Saffron primary, Inter, true-grayscale neutrals.

const ihTokens = {
  primary: 'hsl(24 95% 53%)',
  primaryFg: '#fff',
  primaryTint: 'hsl(24 95% 53% / 0.10)',
  primaryTintStrong: 'hsl(24 95% 53% / 0.15)',
  primaryDeep: 'hsl(24 95% 38%)',
  bg: 'hsl(0 0% 100%)',
  bgSubtle: 'hsl(0 0% 98%)',
  card: '#fff',
  fg: 'hsl(0 0% 9%)',
  mutedFg: 'hsl(0 0% 45%)',
  border: 'hsl(0 0% 90%)',
  muted: 'hsl(0 0% 96%)',
  destructive: 'hsl(0 84% 60%)',
  destructiveDeep: 'hsl(0 70% 45%)',
  success: 'hsl(142 71% 45%)',
  warning: 'hsl(38 92% 50%)',
  info: 'hsl(217 91% 60%)',
  font: 'Inter, system-ui, -apple-system, sans-serif',
  mono: 'ui-monospace, "JetBrains Mono", Consolas, monospace',
};

// ─── Page header ─────────────────────────────────────────────
function IHPageHeader({ flag = '🇮🇳', location = 'Гоа', dayN = 3, dayTotal = 12 }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px 12px', borderBottom: `1px solid ${ihTokens.border}`,
      background: ihTokens.bg,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>{flag}</span>
        <div>
          <div style={{ font: `600 15px/1.2 ${ihTokens.font}`, color: ihTokens.fg, letterSpacing: '-0.01em' }}>{location}</div>
          <div style={{ font: `500 11px/1.2 ${ihTokens.mono}`, color: ihTokens.mutedFg, marginTop: 2, letterSpacing: '0.04em' }}>
            ДЕНЬ {dayN} ИЗ {dayTotal}
          </div>
        </div>
      </div>
      <button aria-label="Профиль" style={{
        width: 36, height: 36, borderRadius: 9999, border: `1px solid ${ihTokens.border}`,
        background: ihTokens.muted, font: `600 13px/1 ${ihTokens.font}`, color: ihTokens.fg, cursor: 'pointer',
      }}>АК</button>
    </div>
  );
}

// ─── Now / Next timeline card ───────────────────────────────
function IHTimelineCard({ now, next }) {
  return (
    <div style={{
      background: ihTokens.card, border: `1px solid ${ihTokens.border}`,
      borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* NOW */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 9999, background: ihTokens.primary, animation: 'ihPulse 2s ease-in-out infinite' }} />
          <span style={{ font: `500 11px/1 ${ihTokens.font}`, color: ihTokens.primaryDeep, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Сейчас</span>
        </div>
        <div style={{ font: `600 17px/1.3 ${ihTokens.font}`, color: ihTokens.fg, letterSpacing: '-0.01em' }}>{now.title}</div>
        <div style={{ font: `400 13px/1.4 ${ihTokens.font}`, color: ihTokens.mutedFg, marginTop: 4 }}>{now.subtitle}</div>
      </div>

      {/* divider with countdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: ihTokens.border }} />
        <span style={{ font: `500 12px/1 ${ihTokens.mono}`, color: ihTokens.mutedFg, fontVariantNumeric: 'tabular-nums' }}>
          ↓ через {next.in}
        </span>
        <div style={{ flex: 1, height: 1, background: ihTokens.border }} />
      </div>

      {/* NEXT */}
      <div>
        <div style={{ font: `500 11px/1 ${ihTokens.font}`, color: ihTokens.mutedFg, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Следующее</div>
        <div style={{ font: `600 16px/1.3 ${ihTokens.font}`, color: ihTokens.fg, letterSpacing: '-0.01em' }}>{next.title}</div>
        <div style={{ font: `400 13px/1.4 ${ihTokens.font}`, color: ihTokens.mutedFg, marginTop: 4 }}>{next.subtitle}</div>
      </div>

      <button style={{
        marginTop: 2, padding: '10px 12px', borderRadius: 10,
        background: 'transparent', border: `1px solid ${ihTokens.border}`,
        font: `500 13px/1 ${ihTokens.font}`, color: ihTokens.fg, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>Посмотреть весь день</span>
        <span style={{ color: ihTokens.mutedFg }}>→</span>
      </button>
    </div>
  );
}

// ─── Quick actions grid ──────────────────────────────────────
function IHQuickActions({ onAction }) {
  const items = [
    { id: 'docs', icon: '📂', label: 'Документы' },
    { id: 'route', icon: '🗺️', label: 'Маршрут' },
    { id: 'concierge', icon: '💬', label: 'Concierge' },
    { id: 'guide', icon: '📞', label: 'Гид' },
  ];
  return (
    <div>
      <div style={{ font: `500 11px/1 ${ihTokens.font}`, color: ihTokens.mutedFg, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10, display:'flex', alignItems:'center', gap: 6 }}>
        <span>⚡</span><span>Быстро</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {items.map(it => (
          <button key={it.id} onClick={() => onAction && onAction(it.id)} style={{
            background: ihTokens.card, border: `1px solid ${ihTokens.border}`,
            borderRadius: 14, padding: '12px 4px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 100ms ease-out',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: ihTokens.primaryTint,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>{it.icon}</div>
            <div style={{ font: `500 12px/1.2 ${ihTokens.font}`, color: ihTokens.fg }}>{it.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Кружок prompt card ──────────────────────────────────────
function IHCircleCard({ onRecord, onText }) {
  return (
    <div style={{
      background: ihTokens.card, border: `1px solid ${ihTokens.border}`,
      borderRadius: 16, padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 9999, background: ihTokens.primaryTint,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>🎬</div>
        <div style={{ flex: 1 }}>
          <div style={{ font: `600 15px/1.3 ${ihTokens.font}`, color: ihTokens.fg }}>Как прошёл день?</div>
          <div style={{ font: `400 12px/1.4 ${ihTokens.font}`, color: ihTokens.mutedFg, marginTop: 2 }}>Запишите кружок до 60 секунд</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button onClick={onRecord} style={{
          padding: '10px 12px', borderRadius: 10, background: ihTokens.primary, color: ihTokens.primaryFg,
          border: 'none', font: `500 13px/1 ${ihTokens.font}`, cursor: 'pointer',
        }}>🎬 Записать кружок</button>
        <button onClick={onText} style={{
          padding: '10px 12px', borderRadius: 10, background: 'transparent', color: ihTokens.fg,
          border: `1px solid ${ihTokens.border}`, font: `500 13px/1 ${ihTokens.font}`, cursor: 'pointer',
        }}>📝 Текстом</button>
      </div>
    </div>
  );
}

// ─── SOS hold-to-trigger button ──────────────────────────────
function IHSosButton({ onActivate }) {
  const [progress, setProgress] = React.useState(0);
  const [holding, setHolding] = React.useState(false);
  const rafRef = React.useRef(null);
  const startRef = React.useRef(0);

  const tick = () => {
    const elapsed = (performance.now() - startRef.current) / 2000;
    const p = Math.min(1, elapsed);
    setProgress(p);
    if (p < 1) rafRef.current = requestAnimationFrame(tick);
    else { setHolding(false); onActivate && onActivate(); }
  };

  const start = () => {
    setHolding(true);
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  };
  const cancel = () => {
    cancelAnimationFrame(rafRef.current);
    setHolding(false);
    setProgress(0);
  };

  return (
    <button
      onMouseDown={start} onMouseUp={cancel} onMouseLeave={cancel}
      onTouchStart={start} onTouchEnd={cancel}
      style={{
        width: '100%', height: 60, borderRadius: 16, border: 'none',
        background: ihTokens.destructive, color: '#fff', position: 'relative', overflow: 'hidden',
        font: `600 15px/1 ${ihTokens.font}`, cursor: 'pointer',
        boxShadow: '0 8px 20px hsl(0 84% 60% / 0.35), 0 2px 6px hsl(0 84% 40% / 0.25)',
        userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
      <div style={{
        position: 'absolute', inset: 0, background: 'hsl(0 84% 50%)',
        width: `${progress * 100}%`, transition: holding ? 'none' : 'width 200ms ease-out',
      }} />
      <span style={{ position: 'relative', zIndex: 1 }}>
        🆘 {holding ? `Удерживайте · ${(progress * 2).toFixed(1)}с` : 'SOS — нажмите и держите'}
      </span>
    </button>
  );
}

// ─── Bottom sheet (used for Документы / Маршрут / Concierge) ──
function IHBottomSheet({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.32)',
        animation: 'ihFadeIn 200ms ease-out',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: ihTokens.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: '8px 16px 24px', boxShadow: '0 -10px 30px rgba(0,0,0,0.15)',
        animation: 'ihSlideUp 250ms cubic-bezier(0.4,0,0.2,1)',
        maxHeight: '85%', overflowY: 'auto',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 9999, background: ihTokens.border, margin: '6px auto 16px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ font: `600 18px/1.2 ${ihTokens.font}`, color: ihTokens.fg, letterSpacing: '-0.01em' }}>{title}</div>
          <button onClick={onClose} aria-label="Закрыть" style={{
            width: 32, height: 32, borderRadius: 9999, border: 'none', background: ihTokens.muted,
            font: `500 15px/1 ${ihTokens.font}`, color: ihTokens.fg, cursor: 'pointer',
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Document row (for Документы sheet) ──────────────────────
function IHDocRow({ icon, title, subtitle, status }) {
  return (
    <button style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 12px', borderRadius: 12, border: `1px solid ${ihTokens.border}`,
      background: ihTokens.card, marginBottom: 8, cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: ihTokens.muted,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: `500 14px/1.3 ${ihTokens.font}`, color: ihTokens.fg }}>{title}</div>
        <div style={{ font: `400 12px/1.3 ${ihTokens.font}`, color: ihTokens.mutedFg, marginTop: 2 }}>{subtitle}</div>
      </div>
      {status === 'cached' && (
        <span style={{
          font: `500 11px/1 ${ihTokens.font}`, padding: '4px 8px', borderRadius: 9999,
          background: 'hsl(142 71% 45% / 0.12)', color: 'hsl(142 71% 30%)',
        }}>оффлайн</span>
      )}
      <span style={{ color: ihTokens.mutedFg, marginLeft: 4 }}>→</span>
    </button>
  );
}

// Export
Object.assign(window, {
  ihTokens, IHPageHeader, IHTimelineCard, IHQuickActions,
  IHCircleCard, IHSosButton, IHBottomSheet, IHDocRow,
});
