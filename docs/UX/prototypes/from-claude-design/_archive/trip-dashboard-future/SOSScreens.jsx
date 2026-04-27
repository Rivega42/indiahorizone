// SOSScreens.jsx — IndiaHorizone #198 + #199
// #198: «Floating-button SOS, hold 2sec заполняет круг, после trigger показ "Помощь идёт. Дежурный — X. ETA ~60sec"»
// #199: «После trigger: live-обновление статуса (sent → ack → дежурный X на связи), open chat»

const ihSosStyles = {
  page: { background: 'hsl(0 0% 98%)', minHeight: '100%', position: 'relative', display: 'flex', flexDirection: 'column' },
  header: { padding: '14px 20px', background: '#fff', borderBottom: '1px solid hsl(0 0% 90%)' },
  title: { font: '600 18px/1.2 Inter', color: 'hsl(0 0% 9%)' },
  body: { padding: 20, flex: 1 },
  hint: { background: 'hsl(0 84% 60% / 0.08)', border: '1px solid hsl(0 84% 60% / 0.25)', padding: 14, borderRadius: 12, color: 'hsl(0 84% 35%)', font: '400 13px/1.5 Inter', marginBottom: 20 },
  fab: { position: 'absolute', right: 24, bottom: 90, width: 80, height: 80, borderRadius: 9999, background: 'hsl(0 84% 60%)', border: 'none', color: '#fff', font: '700 16px/1 Inter', cursor: 'pointer', boxShadow: '0 8px 24px rgba(220, 38, 38, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none', touchAction: 'none' },
  fabHint: { position: 'absolute', right: 110, bottom: 110, font: '500 12px/1.3 Inter', color: 'hsl(0 0% 35%)', textAlign: 'right' },

  // active screen
  activePage: { background: 'linear-gradient(180deg, hsl(0 84% 60%) 0%, hsl(0 70% 45%) 100%)', minHeight: '100%', color: '#fff', display: 'flex', flexDirection: 'column' },
  activeHeader: { padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cancelBtn: { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '6px 12px', borderRadius: 9999, font: '500 12px/1 Inter', cursor: 'pointer' },
  liveBadge: { display: 'flex', alignItems: 'center', gap: 6, font: '500 12px/1 Inter' },
  liveDot: { width: 8, height: 8, borderRadius: 9999, background: '#fff', animation: 'ihPulse 1.4s infinite' },
  hero: { textAlign: 'center', padding: '40px 24px 24px' },
  heroTitle: { font: '700 28px/1.2 Inter', letterSpacing: '-0.02em', marginBottom: 8 },
  heroSub: { font: '400 14px/1.5 Inter', opacity: 0.92 },
  pulseRing: { width: 140, height: 140, borderRadius: 9999, margin: '32px auto', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.4)' },
  pulseInner: { width: 80, height: 80, borderRadius: 9999, background: '#fff', color: 'hsl(0 84% 60%)', font: '700 30px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  steps: { padding: '0 24px', marginTop: 12 },
  step: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0' },
  stepDot: { width: 22, height: 22, borderRadius: 9999, border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '500 12px/1 Inter' },
  stepDotOn: { background: '#fff', color: 'hsl(0 84% 45%)', borderColor: '#fff' },
  stepBody: { flex: 1 },
  stepTitle: { font: '500 14px/1.3 Inter' },
  stepTime: { font: '400 12px/1.4 Inter', opacity: 0.75, marginTop: 2 },
  duty: { background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, padding: 14, margin: '20px 24px', display: 'flex', gap: 12, alignItems: 'center' },
  dutyAv: { width: 48, height: 48, borderRadius: 9999, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 16px/1 Inter', flexShrink: 0 },
  dutyName: { font: '600 14px/1.3 Inter' },
  dutyRole: { font: '400 12px/1.4 Inter', opacity: 0.85, marginTop: 2 },
  bottomActions: { padding: 20, display: 'flex', gap: 10, marginTop: 'auto' },
  callBtn: { flex: 1, padding: 14, borderRadius: 12, background: '#fff', color: 'hsl(0 84% 45%)', border: 'none', font: '600 14px/1 Inter', cursor: 'pointer' },
  chatBtn: { flex: 1, padding: 14, borderRadius: 12, background: 'rgba(0,0,0,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', font: '500 14px/1 Inter', cursor: 'pointer' },
};

function IHSosCharge({ progress, size = 80 }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)', pointerEvents: 'none' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - c * progress} />
    </svg>
  );
}

function IHSosTriggerScreen({ onTrigger }) {
  const [progress, setProgress] = React.useState(0);
  const startRef = React.useRef(0);
  const rafRef = React.useRef(0);

  const tick = () => {
    const elapsed = (performance.now() - startRef.current) / 2000;
    const p = Math.min(1, elapsed);
    setProgress(p);
    if (p >= 1) { onTrigger && onTrigger(); return; }
    rafRef.current = requestAnimationFrame(tick);
  };
  const start = (e) => { e.preventDefault(); startRef.current = performance.now(); rafRef.current = requestAnimationFrame(tick); };
  const stop = () => { cancelAnimationFrame(rafRef.current); setProgress(0); };

  return (
    <div style={ihSosStyles.page}>
      <div style={ihSosStyles.header}><div style={ihSosStyles.title}>Экстренная помощь</div></div>
      <div style={ihSosStyles.body}>
        <div style={ihSosStyles.hint}>
          <strong>Как это работает.</strong> Зажмите красную кнопку на 2 секунды.
          Дежурный concierge получит ваше местоположение и свяжется в течение минуты.
        </div>
        <div style={{ font: '400 14px/1.6 Inter', color: 'hsl(0 0% 35%)' }}>
          <p>Используйте, если:</p>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            <li>вам срочно нужна помощь, и вы не успеваете писать;</li>
            <li>заблудились или потеряли документы;</li>
            <li>возникла медицинская ситуация.</li>
          </ul>
          <p style={{ marginTop: 16, color: 'hsl(0 0% 55%)', font: '400 12px/1.5 Inter' }}>
            При нажатии передаются: имя, координаты (по согласию B+), номер поездки.
          </p>
        </div>
      </div>
      <div style={ihSosStyles.fabHint}>Зажмите →<br/>2 секунды</div>
      <button
        style={ihSosStyles.fab}
        onMouseDown={start} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchEnd={stop} onTouchCancel={stop}
      >
        <IHSosCharge progress={progress} size={80} />
        <span style={{ position: 'relative', zIndex: 1 }}>SOS</span>
      </button>
    </div>
  );
}

function IHSosActiveScreen({ stage = 'sent', onCancel }) {
  // stage: sent | ack | connected
  const stages = [
    { id: 'sent', t: 'Сигнал отправлен', sub: 'Сейчас · координаты получены' },
    { id: 'ack', t: 'Дежурный принял заявку', sub: '~12 сек назад' },
    { id: 'connected', t: 'Прия на связи', sub: 'Прочла ваше местоположение' },
  ];
  const order = ['sent', 'ack', 'connected'];
  const idx = order.indexOf(stage);

  return (
    <div style={ihSosStyles.activePage}>
      <style>{`@keyframes ihPulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } } @keyframes ihRingPulse { 0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.5) } 100% { box-shadow: 0 0 0 28px rgba(255,255,255,0) } }`}</style>
      <div style={ihSosStyles.activeHeader}>
        <div style={ihSosStyles.liveBadge}>
          <div style={ihSosStyles.liveDot} />
          <span>Помощь в пути</span>
        </div>
        <button style={ihSosStyles.cancelBtn} onClick={onCancel}>Отменить</button>
      </div>

      <div style={ihSosStyles.hero}>
        <div style={ihSosStyles.heroTitle}>Помощь идёт</div>
        <div style={ihSosStyles.heroSub}>Дежурный — Прия. ETA ~60 сек.</div>
      </div>

      <div style={{ ...ihSosStyles.pulseRing, animation: 'ihRingPulse 2s infinite' }}>
        <div style={ihSosStyles.pulseInner}>!</div>
      </div>

      <div style={ihSosStyles.steps}>
        {stages.map((s, i) => {
          const done = i <= idx;
          return (
            <div key={s.id} style={ihSosStyles.step}>
              <div style={{ ...ihSosStyles.stepDot, ...(done ? ihSosStyles.stepDotOn : {}) }}>
                {done ? '✓' : ''}
              </div>
              <div style={ihSosStyles.stepBody}>
                <div style={{ ...ihSosStyles.stepTitle, opacity: done ? 1 : 0.6 }}>{s.t}</div>
                <div style={ihSosStyles.stepTime}>{done ? s.sub : 'ожидание…'}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={ihSosStyles.duty}>
        <div style={ihSosStyles.dutyAv}>ПР</div>
        <div style={{ flex: 1 }}>
          <div style={ihSosStyles.dutyName}>Прия Шарма</div>
          <div style={ihSosStyles.dutyRole}>Дежурный concierge · Дели</div>
        </div>
      </div>

      <div style={ihSosStyles.bottomActions}>
        <button style={ihSosStyles.callBtn}>📞 Позвонить</button>
        <button style={ihSosStyles.chatBtn}>💬 Открыть чат</button>
      </div>
    </div>
  );
}

Object.assign(window, { IHSosTriggerScreen, IHSosActiveScreen });
