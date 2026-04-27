// FeedbackScreen.jsx — IndiaHorizone #190 (rev2)
// «Кружок — primary action. Текст и фото — secondary. Photo upload + thumbnails»

const ihFbStyles = {
  page: { background: 'hsl(0 0% 98%)', minHeight: '100%', display: 'flex', flexDirection: 'column' },
  header: { padding: '16px 20px 14px', borderBottom: '1px solid hsl(0 0% 90%)', background: '#fff' },
  title: { font: '600 22px/1.2 Inter', color: 'hsl(0 0% 9%)', letterSpacing: '-0.015em' },
  sub: { font: '400 13px/1.5 Inter', color: 'hsl(0 0% 45%)', marginTop: 4 },
  body: { padding: 20, flex: 1, display: 'flex', flexDirection: 'column' },

  // Primary: кружок
  primaryCard: { background: 'linear-gradient(160deg, hsl(0 0% 12%), hsl(0 0% 4%))', borderRadius: 20, padding: '28px 22px', textAlign: 'center', color: '#fff', position: 'relative', overflow: 'hidden', marginBottom: 14 },
  primaryEyebrow: { font: '500 11px/1 Inter', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(24 95% 65%)', marginBottom: 14 },
  primaryShutter: { width: 96, height: 96, borderRadius: 9999, background: 'transparent', border: '4px solid #fff', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, position: 'relative' },
  primaryShutterCore: { width: 76, height: 76, borderRadius: 9999, background: 'hsl(0 84% 60%)' },
  primaryShutterPulse: { position: 'absolute', inset: -8, borderRadius: 9999, border: '2px solid hsl(0 84% 60%)', opacity: 0.4, animation: 'ihShutterPulse 2s infinite ease-out' },
  primaryTitle: { font: '600 18px/1.3 Inter', letterSpacing: '-0.01em', marginBottom: 6 },
  primaryDesc: { font: '400 13px/1.5 Inter', color: 'rgba(255,255,255,0.7)', maxWidth: 280, margin: '0 auto' },

  // Mood (всегда виден)
  moodLabel: { font: '500 13px/1.2 Inter', color: 'hsl(0 0% 9%)', marginBottom: 10, marginTop: 4 },
  moodRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 18 },
  mood: { width: 52, height: 52, borderRadius: 9999, border: '1.5px solid hsl(0 0% 90%)', background: '#fff', cursor: 'pointer', fontSize: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' },
  moodOn: { borderColor: 'hsl(24 95% 53%)', background: 'hsl(24 95% 53% / 0.1)', transform: 'scale(1.08)' },

  // Secondary section: текст + фото
  secondaryLabel: { font: '500 12px/1 Inter', color: 'hsl(0 0% 45%)', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' },
  textarea: { width: '100%', boxSizing: 'border-box', font: '400 14px/1.5 Inter', padding: 14, border: '1px solid hsl(0 0% 90%)', borderRadius: 12, background: '#fff', minHeight: 96, resize: 'none', outline: 'none' },
  counter: { font: '400 12px/1.2 Inter', color: 'hsl(0 0% 55%)', textAlign: 'right', marginTop: 4, marginBottom: 14 },

  // Photo strip
  photoStrip: { display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
  photoTile: { width: 64, height: 64, borderRadius: 10, position: 'relative', overflow: 'hidden' },
  photoRemove: { position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9999, background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', font: '500 10px/1 Inter', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
  photoAdd: { width: 64, height: 64, borderRadius: 10, border: '1.5px dashed hsl(0 0% 75%)', background: 'hsl(0 0% 96%)', color: 'hsl(0 0% 35%)', font: '500 11px/1.2 Inter', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 0 },
  photoAddIcon: { fontSize: 22, lineHeight: 1 },

  submit: { width: '100%', padding: 16, borderRadius: 12, background: 'hsl(24 95% 53%)', color: '#fff', border: 'none', font: '500 15px/1 Inter', cursor: 'pointer', marginTop: 'auto' },
};

const IH_MOODS = [
  { e: '😞', l: 'Плохо' },
  { e: '😐', l: 'Так себе' },
  { e: '🙂', l: 'Норм' },
  { e: '😊', l: 'Хорошо' },
  { e: '🤩', l: 'Восторг' },
];

const IH_PHOTO_TINTS = [
  'linear-gradient(135deg, hsl(28 80% 60%), hsl(14 70% 45%))',
  'linear-gradient(135deg, hsl(195 60% 55%), hsl(220 50% 35%))',
  'linear-gradient(135deg, hsl(45 90% 60%), hsl(28 80% 45%))',
  'linear-gradient(135deg, hsl(140 40% 55%), hsl(160 30% 30%))',
];

function IHFeedbackScreen() {
  const [mood, setMood] = React.useState(3);
  const [text, setText] = React.useState('');
  const [photos, setPhotos] = React.useState([0, 1]); // pre-attached demo
  const fileRef = React.useRef(null);

  const addPhotos = () => fileRef.current && fileRef.current.click();
  const onFile = (e) => {
    const n = e.target.files ? e.target.files.length : 1;
    setPhotos(p => [...p, ...Array.from({ length: n }).map((_, i) => p.length + i)]);
    e.target.value = '';
  };
  const removePhoto = (i) => setPhotos(p => p.filter((_, k) => k !== i));

  return (
    <div style={ihFbStyles.page}>
      <style>{`@keyframes ihShutterPulse { 0% { transform: scale(1); opacity: 0.5 } 100% { transform: scale(1.4); opacity: 0 } }`}</style>
      <div style={ihFbStyles.header}>
        <div style={ihFbStyles.title}>Как прошёл день?</div>
        <div style={ihFbStyles.sub}>Расскажите своими словами — это лучшая благодарность команде</div>
      </div>
      <div style={ihFbStyles.body}>

        {/* Primary: кружок */}
        <div style={ihFbStyles.primaryCard}>
          <div style={ihFbStyles.primaryEyebrow}>● Главное</div>
          <button style={ihFbStyles.primaryShutter}>
            <div style={ihFbStyles.primaryShutterPulse} />
            <div style={ihFbStyles.primaryShutterCore} />
          </button>
          <div style={ihFbStyles.primaryTitle}>Записать кружок</div>
          <div style={ihFbStyles.primaryDesc}>До 60 секунд. Самый живой формат — мы видим вас, слышим интонацию.</div>
        </div>

        {/* Mood */}
        <div style={ihFbStyles.moodLabel}>Настроение дня</div>
        <div style={ihFbStyles.moodRow}>
          {IH_MOODS.map((m, i) => (
            <button key={i} onClick={() => setMood(i)}
              style={{ ...ihFbStyles.mood, ...(mood === i ? ihFbStyles.moodOn : {}) }}
              title={m.l}>
              {m.e}
            </button>
          ))}
        </div>

        {/* Secondary: photo + text */}
        <div style={ihFbStyles.secondaryLabel}>Можно добавить ↓</div>

        <div style={ihFbStyles.photoStrip}>
          {photos.map((p, i) => (
            <div key={i} style={{ ...ihFbStyles.photoTile, background: IH_PHOTO_TINTS[p % IH_PHOTO_TINTS.length] }}>
              <button style={ihFbStyles.photoRemove} onClick={() => removePhoto(i)}>✕</button>
            </div>
          ))}
          <button style={ihFbStyles.photoAdd} onClick={addPhotos}>
            <span style={ihFbStyles.photoAddIcon}>＋</span>
            <span>Фото</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onFile} />
        </div>

        <textarea style={ihFbStyles.textarea}
          placeholder="Несколько слов, если хочется добавить…"
          maxLength={500}
          value={text} onChange={e => setText(e.target.value)} />
        <div style={ihFbStyles.counter}>{text.length} / 500</div>

        <button style={ihFbStyles.submit}>Отправить фидбек</button>
      </div>
    </div>
  );
}

Object.assign(window, { IHFeedbackScreen });
