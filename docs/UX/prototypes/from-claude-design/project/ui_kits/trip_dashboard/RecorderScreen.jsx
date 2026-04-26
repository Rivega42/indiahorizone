// RecorderScreen.jsx — IndiaHorizone #179
// «Полноэкранный recorder с фронтальной камерой, hold-to-record / tap-start, 60sec countdown, preview + retake»

const ihRecStyles = {
  page: { background: '#000', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  viewfinder: { flex: 1, position: 'relative', overflow: 'hidden' },
  fakeFeed: { position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 50% 30%, hsl(28 60% 50%), hsl(28 30% 18%) 60%, #000 100%)' },
  fakeSilhouette: { position: 'absolute', left: '50%', top: '34%', width: 180, height: 220, transform: 'translateX(-50%)', background: 'radial-gradient(ellipse at 50% 30%, hsl(28 40% 30% / 0.6), transparent 70%)', borderRadius: '50% 50% 45% 45%' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 },
  closeBtn: { width: 36, height: 36, borderRadius: 9999, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', font: '500 16px/1 Inter', cursor: 'pointer' },
  flipBtn: { width: 36, height: 36, borderRadius: 9999, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', font: '500 14px/1 Inter', cursor: 'pointer' },
  countdown: { position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', color: '#fff', font: '500 13px/1 ui-monospace, "JetBrains Mono", monospace', padding: '6px 12px', borderRadius: 9999, display: 'flex', alignItems: 'center', gap: 6, zIndex: 5 },
  recDot: { width: 8, height: 8, borderRadius: 9999, background: 'hsl(0 84% 60%)', animation: 'ihRecBlink 1.4s infinite ease-in-out' },
  hint: { position: 'absolute', bottom: 160, left: '50%', transform: 'translateX(-50%)', color: '#fff', font: '500 13px/1.4 Inter', textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.6)', maxWidth: 240, opacity: 0.85 },
  controls: { padding: '20px 0 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, position: 'relative', zIndex: 5 },
  shutter: { width: 72, height: 72, borderRadius: 9999, background: 'transparent', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', padding: 0 },
  shutterCore: { width: 56, height: 56, borderRadius: 9999, background: 'hsl(0 84% 60%)', transition: 'all .2s' },
  shutterCoreOn: { width: 28, height: 28, borderRadius: 6 },
  ringSvg: { position: 'absolute', inset: -6, transform: 'rotate(-90deg)' },
  modeRow: { position: 'absolute', bottom: 130, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16, zIndex: 5 },
  modeBtn: { font: '500 12px/1 Inter', color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 9999, opacity: 0.6 },
  modeBtnOn: { background: 'rgba(255,255,255,0.18)', opacity: 1 },
  // preview
  preview: { position: 'absolute', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', zIndex: 10 },
  previewVideo: { flex: 1, position: 'relative', background: 'radial-gradient(120% 80% at 50% 30%, hsl(28 60% 50%), hsl(28 30% 18%) 60%, #000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 64, height: 64, borderRadius: 9999, background: 'rgba(255,255,255,0.85)', border: 'none', font: '500 22px/1 Inter', color: '#000', cursor: 'pointer' },
  prevBar: { position: 'absolute', bottom: 16, left: 16, right: 16, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 9999, overflow: 'hidden' },
  prevFill: { height: '100%', width: '40%', background: '#fff', borderRadius: 9999 },
  prevActions: { padding: '20px 20px 32px', display: 'flex', gap: 12, background: '#000' },
  retake: { flex: 1, padding: '14px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', font: '500 14px/1 Inter', cursor: 'pointer' },
  send: { flex: 1, padding: '14px', borderRadius: 12, background: 'hsl(24 95% 53%)', border: 'none', color: '#fff', font: '500 14px/1 Inter', cursor: 'pointer' },
};

function IHCircleProgress({ progress }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <svg style={ihRecStyles.ringSvg} width="84" height="84" viewBox="0 0 84 84">
      <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
      <circle cx="42" cy="42" r={r} fill="none" stroke="hsl(0 84% 60%)" strokeWidth="3"
        strokeDasharray={c} strokeDashoffset={c - c * progress} strokeLinecap="round" />
    </svg>
  );
}

function IHRecorderScreen({ initial = 'idle', mode = 'tap' }) {
  const [state, setState] = React.useState(initial); // idle | recording | preview
  const [secs, setSecs] = React.useState(0);
  const [recMode, setRecMode] = React.useState(mode);

  React.useEffect(() => {
    if (state !== 'recording') return;
    const id = setInterval(() => setSecs(s => {
      if (s >= 60) { clearInterval(id); setState('preview'); return 60; }
      return s + 1;
    }), 1000);
    return () => clearInterval(id);
  }, [state]);

  const start = () => { setSecs(0); setState('recording'); };
  const stop = () => setState('preview');
  const retake = () => { setSecs(0); setState('idle'); };

  return (
    <div style={ihRecStyles.page}>
      <style>{`@keyframes ihRecBlink { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>

      <div style={ihRecStyles.viewfinder}>
        <div style={ihRecStyles.fakeFeed} />
        <div style={ihRecStyles.fakeSilhouette} />

        <div style={ihRecStyles.topBar}>
          <button style={ihRecStyles.closeBtn}>✕</button>
          <button style={ihRecStyles.flipBtn}>↺</button>
        </div>

        {state === 'recording' && (
          <div style={ihRecStyles.countdown}>
            <div style={ihRecStyles.recDot} />
            <span>0:{String(secs).padStart(2, '0')} / 1:00</span>
          </div>
        )}

        {state === 'idle' && (
          <div style={ihRecStyles.hint}>
            {recMode === 'hold' ? 'Зажмите кнопку, чтобы записать кружок' : 'Нажмите, чтобы начать. До 60 секунд.'}
          </div>
        )}

        <div style={ihRecStyles.modeRow}>
          {[{ id: 'tap', l: 'Tap-start' }, { id: 'hold', l: 'Hold' }].map(m => (
            <button key={m.id} onClick={() => setRecMode(m.id)}
              style={{ ...ihRecStyles.modeBtn, ...(recMode === m.id ? ihRecStyles.modeBtnOn : {}) }}>
              {m.l}
            </button>
          ))}
        </div>
      </div>

      <div style={ihRecStyles.controls}>
        <button
          style={ihRecStyles.shutter}
          onClick={() => { if (recMode === 'tap') state === 'idle' ? start() : stop(); }}
          onMouseDown={() => { if (recMode === 'hold') start(); }}
          onMouseUp={() => { if (recMode === 'hold') stop(); }}
        >
          {state === 'recording' && <IHCircleProgress progress={secs / 60} />}
          <div style={{ ...ihRecStyles.shutterCore, ...(state === 'recording' ? ihRecStyles.shutterCoreOn : {}) }} />
        </button>
      </div>

      {state === 'preview' && (
        <div style={ihRecStyles.preview}>
          <div style={ihRecStyles.topBar}>
            <button style={ihRecStyles.closeBtn} onClick={retake}>✕</button>
            <div style={{ font: '500 13px/1 Inter', color: '#fff', opacity: 0.8 }}>0:{String(secs).padStart(2, '0')}</div>
          </div>
          <div style={ihRecStyles.previewVideo}>
            <button style={ihRecStyles.playBtn}>▶</button>
            <div style={ihRecStyles.prevBar}><div style={ihRecStyles.prevFill} /></div>
          </div>
          <div style={ihRecStyles.prevActions}>
            <button style={ihRecStyles.retake} onClick={retake}>Перезаписать</button>
            <button style={ihRecStyles.send}>Отправить</button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { IHRecorderScreen });
