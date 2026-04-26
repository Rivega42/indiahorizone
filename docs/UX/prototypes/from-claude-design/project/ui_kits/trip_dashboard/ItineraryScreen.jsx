// ItineraryScreen.jsx — IndiaHorizone #156
// «Список 12 дней путешествия, expandable items со временем/адресом/контактом, прогресс "вы прошли 3/12"»

const ihItinStyles = {
  page: { background: 'hsl(0 0% 98%)', minHeight: '100%' },
  header: { padding: '14px 20px 16px', background: '#fff', borderBottom: '1px solid hsl(0 0% 90%)' },
  title: { font: '600 22px/1.2 Inter', color: 'hsl(0 0% 9%)', letterSpacing: '-0.015em', marginBottom: 4 },
  sub: { font: '400 13px/1.4 Inter', color: 'hsl(0 0% 45%)' },
  progress: { marginTop: 12 },
  progressTrack: { height: 6, background: 'hsl(0 0% 92%)', borderRadius: 9999, overflow: 'hidden' },
  progressBar: { height: '100%', background: 'hsl(24 95% 53%)', borderRadius: 9999 },
  progressLabel: { display: 'flex', justifyContent: 'space-between', marginTop: 6, font: '500 12px/1.2 Inter', color: 'hsl(0 0% 45%)' },
  list: { padding: '12px 16px 32px' },
  day: { background: '#fff', border: '1px solid hsl(0 0% 90%)', borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  dayHead: { padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: '#fff', border: 'none', width: '100%', textAlign: 'left' },
  dayBadge: { width: 36, height: 36, borderRadius: 9999, background: 'hsl(0 0% 96%)', font: '600 13px/1 Inter', color: 'hsl(0 0% 35%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dayBadgeOn: { background: 'hsl(24 95% 53%)', color: '#fff' },
  dayBadgeDone: { background: 'hsl(142 71% 45% / 0.15)', color: 'hsl(142 71% 30%)' },
  dayMain: { flex: 1, minWidth: 0 },
  dayTitle: { font: '600 14px/1.3 Inter', color: 'hsl(0 0% 9%)', marginBottom: 2 },
  dayMeta: { font: '400 12px/1.4 Inter', color: 'hsl(0 0% 45%)' },
  chev: { font: '500 16px/1 Inter', color: 'hsl(0 0% 60%)', transition: 'transform 0.2s' },
  body: { padding: '0 16px 14px 60px', borderTop: '1px solid hsl(0 0% 94%)' },
  evt: { display: 'flex', gap: 10, paddingTop: 12 },
  time: { width: 50, font: '500 12px/1.4 ui-monospace, "JetBrains Mono", monospace', color: 'hsl(0 0% 45%)', flexShrink: 0, paddingTop: 1 },
  evtBody: { flex: 1, paddingBottom: 12, borderBottom: '1px dashed hsl(0 0% 90%)' },
  evtTitle: { font: '500 13px/1.3 Inter', color: 'hsl(0 0% 9%)', marginBottom: 2 },
  evtAddr: { font: '400 12px/1.4 Inter', color: 'hsl(0 0% 45%)' },
  evtContact: { display: 'inline-flex', gap: 4, alignItems: 'center', marginTop: 6, font: '500 12px/1 Inter', color: 'hsl(24 95% 38%)', textDecoration: 'none' },
};

const IH_DAYS = [
  { date: 'Пн, 5 май', city: 'Дели', status: 'done', events: [
    { time: '14:30', t: 'Прилёт в Indira Gandhi Intl', a: 'Терминал 3', c: '+91 98765 11122' },
    { time: '16:00', t: 'Трансфер в отель Imperial', a: 'Janpath Lane', c: 'Водитель Раджеш' },
    { time: '20:00', t: 'Ужин в Spice Route', a: 'Connaught Place', c: null },
  ]},
  { date: 'Вт, 6 май', city: 'Дели → Агра', status: 'done', events: [
    { time: '08:00', t: 'Завтрак в отеле', a: 'The Imperial', c: null },
    { time: '10:30', t: 'Выезд в Агру', a: '~3.5 ч', c: 'Гид Прия +91 98765 33344' },
    { time: '15:00', t: 'Тадж-Махал — sunset слот', a: 'East Gate', c: null },
  ]},
  { date: 'Ср, 7 май', city: 'Агра → Джайпур', status: 'today', events: [
    { time: '09:00', t: 'Форт Агры', a: 'Yamuna Riverbank', c: null },
    { time: '13:00', t: 'Ланч и выезд в Джайпур', a: '~5 ч', c: 'Гид Прия' },
    { time: '19:00', t: 'Заселение в Rambagh Palace', a: 'Bhawani Singh Rd', c: '+91 141 221 1919' },
  ]},
  { date: 'Чт, 8 май', city: 'Джайпур', status: 'next', events: [
    { time: '09:30', t: 'Форт Амбер на слоне', a: 'Devisinghpura', c: null },
    { time: '14:00', t: 'Городской дворец', a: 'Tulsi Marg', c: null },
  ]},
  { date: 'Пт, 9 май', city: 'Джайпур → Удайпур', status: 'next', events: [] },
  { date: 'Сб, 10 май', city: 'Удайпур', status: 'next', events: [] },
  { date: 'Вс, 11 май', city: 'Удайпур → Кочи', status: 'next', events: [] },
  { date: 'Пн, 12 май', city: 'Кочи', status: 'next', events: [] },
  { date: 'Вт, 13 май', city: 'Кочи → Аллеппи', status: 'next', events: [] },
  { date: 'Ср, 14 май', city: 'Backwaters houseboat', status: 'next', events: [] },
  { date: 'Чт, 15 май', city: 'Аллеппи → Дели', status: 'next', events: [] },
  { date: 'Пт, 16 май', city: 'Вылет домой', status: 'next', events: [] },
];

function IHItineraryScreen() {
  const [open, setOpen] = React.useState(2);
  const done = IH_DAYS.filter(d => d.status === 'done').length;
  const today = IH_DAYS.findIndex(d => d.status === 'today');
  const passed = today >= 0 ? today : done;

  return (
    <div style={ihItinStyles.page}>
      <div style={ihItinStyles.header}>
        <div style={ihItinStyles.title}>Маршрут</div>
        <div style={ihItinStyles.sub}>Дели → Раджастан → Керала · 12 дней</div>
        <div style={ihItinStyles.progress}>
          <div style={ihItinStyles.progressTrack}>
            <div style={{ ...ihItinStyles.progressBar, width: `${(passed / IH_DAYS.length) * 100}%` }} />
          </div>
          <div style={ihItinStyles.progressLabel}>
            <span>Вы прошли {passed} из {IH_DAYS.length} дней</span>
            <span>{Math.round((passed / IH_DAYS.length) * 100)}%</span>
          </div>
        </div>
      </div>

      <div style={ihItinStyles.list}>
        {IH_DAYS.map((d, i) => {
          const isOpen = open === i;
          const badgeStyle = d.status === 'done' ? ihItinStyles.dayBadgeDone : d.status === 'today' ? ihItinStyles.dayBadgeOn : {};
          return (
            <div key={i} style={ihItinStyles.day}>
              <button onClick={() => setOpen(isOpen ? -1 : i)} style={ihItinStyles.dayHead}>
                <div style={{ ...ihItinStyles.dayBadge, ...badgeStyle }}>
                  {d.status === 'done' ? '✓' : `Д${i + 1}`}
                </div>
                <div style={ihItinStyles.dayMain}>
                  <div style={ihItinStyles.dayTitle}>{d.city}</div>
                  <div style={ihItinStyles.dayMeta}>
                    {d.date}{d.events.length > 0 ? ` · ${d.events.length} событ.` : ' · план уточняется'}
                    {d.status === 'today' && <span style={{ color: 'hsl(24 95% 38%)', fontWeight: 500 }}> · сегодня</span>}
                  </div>
                </div>
                <div style={{ ...ihItinStyles.chev, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</div>
              </button>
              {isOpen && d.events.length > 0 && (
                <div style={ihItinStyles.body}>
                  {d.events.map((e, k) => (
                    <div key={k} style={ihItinStyles.evt}>
                      <div style={ihItinStyles.time}>{e.time}</div>
                      <div style={{ ...ihItinStyles.evtBody, borderBottom: k === d.events.length - 1 ? 'none' : ihItinStyles.evtBody.borderBottom }}>
                        <div style={ihItinStyles.evtTitle}>{e.t}</div>
                        <div style={ihItinStyles.evtAddr}>{e.a}</div>
                        {e.c && <a href="#" style={ihItinStyles.evtContact}>📞 {e.c}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isOpen && d.events.length === 0 && (
                <div style={{ padding: '8px 16px 14px 60px', font: '400 12px/1.4 Inter', color: 'hsl(0 0% 60%)' }}>
                  Concierge добавит события за 48 ч до начала дня
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { IHItineraryScreen });
