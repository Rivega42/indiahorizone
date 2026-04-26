// JournalScreen.jsx — IndiaHorizone #184
// «Таймлайн дней с фото-сетками + кружками-плеерами, кнопка "поделиться приватной ссылкой"»

const ihJrnStyles = {
  page: { background: 'hsl(0 0% 98%)', minHeight: '100%' },
  header: { padding: '14px 20px 14px', background: '#fff', borderBottom: '1px solid hsl(0 0% 90%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title: { font: '600 22px/1.2 Inter', color: 'hsl(0 0% 9%)', letterSpacing: '-0.015em' },
  shareBtn: { font: '500 12px/1 Inter', color: 'hsl(24 95% 38%)', background: 'hsl(24 95% 53% / 0.1)', border: 'none', padding: '8px 12px', borderRadius: 9999, cursor: 'pointer' },
  body: { padding: '12px 16px 32px' },
  dayCard: { background: '#fff', border: '1px solid hsl(0 0% 90%)', borderRadius: 14, marginBottom: 14, overflow: 'hidden' },
  dayHead: { padding: '12px 14px', borderBottom: '1px solid hsl(0 0% 94%)' },
  dayDate: { font: '500 12px/1 Inter', color: 'hsl(0 0% 45%)' },
  dayTitle: { font: '600 15px/1.3 Inter', color: 'hsl(0 0% 9%)', marginTop: 2 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: 2 },
  cell: { aspectRatio: '1 / 1', borderRadius: 4, background: 'hsl(0 0% 85%)', overflow: 'hidden', position: 'relative' },
  circleRow: { padding: '12px 14px', display: 'flex', gap: 10, overflowX: 'auto', borderTop: '1px solid hsl(0 0% 94%)' },
  circle: { width: 76, height: 76, borderRadius: 9999, flexShrink: 0, background: 'linear-gradient(135deg, hsl(28 50% 35%), hsl(0 60% 30%))', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', border: '2px solid hsl(24 95% 53%)' },
  playIcon: { width: 26, height: 26, borderRadius: 9999, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '500 11px/1 Inter', color: '#000', paddingLeft: 2 },
  circleTime: { position: 'absolute', bottom: 4, right: 4, font: '500 9px/1 ui-monospace, "JetBrains Mono", monospace', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 4px', borderRadius: 4 },
  shareModal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 50 },
  sheet: { background: '#fff', width: '100%', borderRadius: '20px 20px 0 0', padding: '20px', boxSizing: 'border-box' },
  sheetTitle: { font: '600 17px/1.2 Inter', marginBottom: 6 },
  sheetDesc: { font: '400 13px/1.5 Inter', color: 'hsl(0 0% 45%)', marginBottom: 16 },
  linkBox: { display: 'flex', gap: 6, padding: '10px 12px', background: 'hsl(0 0% 96%)', borderRadius: 10, font: '500 12px/1.2 ui-monospace, "JetBrains Mono", monospace', color: 'hsl(0 0% 9%)', wordBreak: 'break-all', marginBottom: 12 },
  copyBtn: { padding: '4px 10px', borderRadius: 6, border: 'none', background: 'hsl(24 95% 53%)', color: '#fff', font: '500 11px/1 Inter', cursor: 'pointer', flexShrink: 0 },
  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid hsl(0 0% 94%)' },
};

const IH_DAYS_J = [
  { date: 'Чт, 8 май', city: 'Джайпур · Форт Амбер', photos: 6, circles: [{ t: '0:42', g: 'hsl(28 60% 40%)' }, { t: '1:00', g: 'hsl(0 50% 35%)' }] },
  { date: 'Ср, 7 май', city: 'Тадж-Махал на закате', photos: 9, circles: [{ t: '0:55', g: 'hsl(20 70% 45%)' }] },
  { date: 'Вт, 6 май', city: 'Дорога Дели → Агра', photos: 4, circles: [] },
  { date: 'Пн, 5 май', city: 'Прилёт в Дели', photos: 3, circles: [{ t: '0:28', g: 'hsl(28 40% 30%)' }] },
];

const photoTints = ['hsl(28 50% 65%)', 'hsl(0 50% 60%)', 'hsl(40 60% 70%)', 'hsl(15 55% 55%)', 'hsl(28 35% 45%)', 'hsl(8 60% 50%)', 'hsl(38 70% 65%)', 'hsl(20 45% 40%)', 'hsl(0 40% 35%)'];

function IHJournalScreen() {
  const [shareOpen, setShareOpen] = React.useState(false);
  const [includeCircles, setIncludeCircles] = React.useState(true);
  return (
    <div style={ihJrnStyles.page}>
      <div style={ihJrnStyles.header}>
        <div style={ihJrnStyles.title}>Дневник</div>
        <button style={ihJrnStyles.shareBtn} onClick={() => setShareOpen(true)}>🔗 Приватная ссылка</button>
      </div>
      <div style={ihJrnStyles.body}>
        {IH_DAYS_J.map((d, i) => (
          <div key={i} style={ihJrnStyles.dayCard}>
            <div style={ihJrnStyles.dayHead}>
              <div style={ihJrnStyles.dayDate}>{d.date}</div>
              <div style={ihJrnStyles.dayTitle}>{d.city}</div>
            </div>
            <div style={ihJrnStyles.grid}>
              {Array.from({ length: d.photos }).map((_, k) => (
                <div key={k} style={{ ...ihJrnStyles.cell, background: `linear-gradient(135deg, ${photoTints[(i * 3 + k) % photoTints.length]}, hsl(0 0% 25%))` }} />
              ))}
            </div>
            {d.circles.length > 0 && (
              <div style={ihJrnStyles.circleRow}>
                {d.circles.map((c, k) => (
                  <button key={k} style={{ ...ihJrnStyles.circle, background: `linear-gradient(135deg, ${c.g}, hsl(0 0% 15%))` }}>
                    <div style={ihJrnStyles.playIcon}>▶</div>
                    <div style={ihJrnStyles.circleTime}>{c.t}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {shareOpen && (
        <div style={ihJrnStyles.shareModal} onClick={() => setShareOpen(false)}>
          <div style={ihJrnStyles.sheet} onClick={e => e.stopPropagation()}>
            <div style={ihJrnStyles.sheetTitle}>Приватная ссылка</div>
            <div style={ihJrnStyles.sheetDesc}>Видна только тем, у кого есть ссылка. Можно отозвать в любой момент.</div>
            <div style={ihJrnStyles.linkBox}>
              <span style={{ flex: 1 }}>indiahorizone.ru/j/anna-may26/9b3e7a05</span>
              <button style={ihJrnStyles.copyBtn}>Копировать</button>
            </div>
            <div style={ihJrnStyles.toggleRow}>
              <span style={{ font: '400 13px/1.4 Inter' }}>Включить кружки</span>
              <button onClick={() => setIncludeCircles(v => !v)}
                style={{ width: 38, height: 22, borderRadius: 9999, border: 'none', background: includeCircles ? 'hsl(24 95% 53%)' : 'hsl(0 0% 85%)', position: 'relative', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', top: 2, left: includeCircles ? 18 : 2, width: 18, height: 18, borderRadius: 9999, background: '#fff', transition: 'left .15s' }} />
              </button>
            </div>
            <button style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 10, background: 'hsl(0 0% 9%)', color: '#fff', border: 'none', font: '500 14px/1 Inter', cursor: 'pointer' }} onClick={() => setShareOpen(false)}>Готово</button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { IHJournalScreen });
