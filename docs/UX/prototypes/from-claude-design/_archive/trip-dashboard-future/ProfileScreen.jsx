// ProfileScreen.jsx — IndiaHorizone #147
// «Экран профиля с табами: личные данные, согласия (4 уровня для photo_video, A/B/C/D для geo), emergency contacts, паспорт»

const ihProfStyles = {
  page: { background: 'hsl(0 0% 98%)', minHeight: '100%' },
  header: { padding: '14px 20px 12px', borderBottom: '1px solid hsl(0 0% 90%)', background: '#fff', display: 'flex', alignItems: 'center', gap: 12 },
  back: { width: 32, height: 32, borderRadius: 9999, border: 'none', background: 'hsl(0 0% 96%)', font: '500 16px/1 Inter', color: 'hsl(0 0% 9%)', cursor: 'pointer' },
  title: { font: '600 17px/1.2 Inter', color: 'hsl(0 0% 9%)', letterSpacing: '-0.01em' },
  tabs: { display: 'flex', gap: 0, padding: '0 12px', background: '#fff', borderBottom: '1px solid hsl(0 0% 90%)', overflowX: 'auto' },
  tab: { flexShrink: 0, padding: '14px 12px', font: '500 13px/1 Inter', color: 'hsl(0 0% 45%)', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: '2px solid transparent' },
  tabOn: { color: 'hsl(0 0% 9%)', borderBottomColor: 'hsl(24 95% 53%)' },
  body: { padding: '16px 20px 32px' },
  field: { marginBottom: 14 },
  label: { display: 'block', font: '500 13px/1.2 Inter', color: 'hsl(0 0% 9%)', marginBottom: 6 },
  input: { width: '100%', boxSizing: 'border-box', font: '400 14px/1.4 Inter', padding: '10px 12px', border: '1px solid hsl(0 0% 90%)', borderRadius: 8, background: '#fff' },
  card: { background: '#fff', border: '1px solid hsl(0 0% 90%)', borderRadius: 14, padding: 14, marginBottom: 12 },
  consentTitle: { font: '600 14px/1.3 Inter', color: 'hsl(0 0% 9%)', marginBottom: 4 },
  consentDesc: { font: '400 12px/1.4 Inter', color: 'hsl(0 0% 45%)', marginBottom: 10 },
  level: { display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 10, border: '1px solid hsl(0 0% 90%)', marginBottom: 6, cursor: 'pointer', background: '#fff' },
  levelOn: { borderColor: 'hsl(24 95% 53%)', background: 'hsl(24 95% 53% / 0.06)' },
  radio: { width: 16, height: 16, borderRadius: 9999, border: '1.5px solid hsl(0 0% 70%)', flexShrink: 0, marginTop: 2, position: 'relative' },
  radioOn: { borderColor: 'hsl(24 95% 53%)' },
  radioInner: { position: 'absolute', inset: 3, borderRadius: 9999, background: 'hsl(24 95% 53%)' },
  saveBtn: { width: '100%', padding: '14px', borderRadius: 10, background: 'hsl(24 95% 53%)', color: '#fff', border: 'none', font: '500 15px/1 Inter', cursor: 'pointer', marginTop: 12 },
};

function IHRadioRow({ on, title, desc, onClick }) {
  return (
    <button onClick={onClick} style={{ ...ihProfStyles.level, ...(on ? ihProfStyles.levelOn : {}), width: '100%', textAlign: 'left' }}>
      <div style={{ ...ihProfStyles.radio, ...(on ? ihProfStyles.radioOn : {}) }}>
        {on && <div style={ihProfStyles.radioInner} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ font: '500 13px/1.3 Inter', color: 'hsl(0 0% 9%)' }}>{title}</div>
        <div style={{ font: '400 12px/1.4 Inter', color: 'hsl(0 0% 45%)', marginTop: 2 }}>{desc}</div>
      </div>
    </button>
  );
}

function IHProfileScreen() {
  const [tab, setTab] = React.useState('personal');
  const [photoConsent, setPhotoConsent] = React.useState(2);
  const [geoConsent, setGeoConsent] = React.useState('B');

  const tabs = [
    { id: 'personal', label: 'Личные данные' },
    { id: 'consents', label: 'Согласия' },
    { id: 'emergency', label: 'Контакты' },
    { id: 'passport', label: 'Паспорт' },
  ];

  return (
    <div style={ihProfStyles.page}>
      <div style={ihProfStyles.header}>
        <button style={ihProfStyles.back}>←</button>
        <div style={ihProfStyles.title}>Профиль</div>
      </div>
      <div style={ihProfStyles.tabs}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...ihProfStyles.tab, ...(tab === t.id ? ihProfStyles.tabOn : {}) }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={ihProfStyles.body}>
        {tab === 'personal' && (
          <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
              <div style={{ width: 64, height: 64, borderRadius: 9999, background: 'hsl(24 95% 53% / 0.15)', color: 'hsl(24 95% 38%)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 22px/1 Inter' }}>АК</div>
              <button style={{ font: '500 13px/1 Inter', color: 'hsl(24 95% 38%)', background: 'transparent', border: '1px solid hsl(0 0% 90%)', borderRadius: 9999, padding: '8px 14px', cursor: 'pointer' }}>Изменить фото</button>
            </div>
            <div style={ihProfStyles.field}><label style={ihProfStyles.label}>Имя и фамилия</label><input style={ihProfStyles.input} defaultValue="Анна Кузнецова" /></div>
            <div style={ihProfStyles.field}><label style={ihProfStyles.label}>Дата рождения</label><input style={ihProfStyles.input} defaultValue="14.06.1987" /></div>
            <div style={ihProfStyles.field}><label style={ihProfStyles.label}>Телефон</label><input style={ihProfStyles.input} defaultValue="+7 916 123-45-67" /></div>
            <div style={ihProfStyles.field}><label style={ihProfStyles.label}>Email</label><input style={ihProfStyles.input} defaultValue="anna.k@почта.рф" /></div>
            <button style={ihProfStyles.saveBtn}>Сохранить</button>
          </>
        )}

        {tab === 'consents' && (
          <>
            <div style={ihProfStyles.card}>
              <div style={ihProfStyles.consentTitle}>📸 Фото и видео</div>
              <div style={ihProfStyles.consentDesc}>Как мы можем использовать ваши снимки и кружки</div>
              {[
                { lvl: 1, t: 'Уровень 1 — только мне', d: 'Фото и видео видны только вам в дневнике' },
                { lvl: 2, t: 'Уровень 2 — команде concierge', d: 'Чтобы помогать делать поездку лучше' },
                { lvl: 3, t: 'Уровень 3 — другим клиентам с тегом', d: 'В групповых поездках по согласию' },
                { lvl: 4, t: 'Уровень 4 — публично, анонимно', d: 'В маркетинге IndiaHorizone без имени' },
              ].map(o => (
                <IHRadioRow key={o.lvl} on={photoConsent === o.lvl} title={o.t} desc={o.d} onClick={() => setPhotoConsent(o.lvl)} />
              ))}
            </div>

            <div style={ihProfStyles.card}>
              <div style={ihProfStyles.consentTitle}>📍 Геолокация</div>
              <div style={ihProfStyles.consentDesc}>Как часто и зачем мы знаем, где вы</div>
              {[
                { lvl: 'A', t: 'A — никогда', d: 'Только если вы сами поделитесь' },
                { lvl: 'B', t: 'B — при SOS и активных трансферах', d: 'Рекомендуем — для экстренной помощи' },
                { lvl: 'C', t: 'C — весь день поездки', d: 'Concierge может предложить место рядом' },
                { lvl: 'D', t: 'D — всегда, включая фоновое', d: 'Максимум поддержки, минимум приватности' },
              ].map(o => (
                <IHRadioRow key={o.lvl} on={geoConsent === o.lvl} title={o.t} desc={o.d} onClick={() => setGeoConsent(o.lvl)} />
              ))}
            </div>

            <button style={ihProfStyles.saveBtn}>Сохранить согласия</button>
          </>
        )}

        {tab === 'emergency' && (
          <>
            <div style={{ font: '400 13px/1.5 Inter', color: 'hsl(0 0% 45%)', marginBottom: 14 }}>
              Кому позвонить, если вы нажали SOS и не отвечаете
            </div>
            {[
              { name: 'Сергей (муж)', phone: '+7 916 555-12-34', primary: true },
              { name: 'Мама', phone: '+7 921 222-99-01', primary: false },
            ].map((c, i) => (
              <div key={i} style={ihProfStyles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ font: '600 14px/1.3 Inter' }}>{c.name}</div>
                    <div style={{ font: '500 13px/1.4 ui-monospace, "JetBrains Mono", monospace', color: 'hsl(0 0% 45%)', marginTop: 3 }}>{c.phone}</div>
                  </div>
                  {c.primary && <span style={{ font: '500 11px/1 Inter', padding: '4px 8px', borderRadius: 9999, background: 'hsl(24 95% 53% / 0.12)', color: 'hsl(24 95% 38%)' }}>Главный</span>}
                </div>
              </div>
            ))}
            <button style={{ ...ihProfStyles.saveBtn, background: 'transparent', color: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 90%)' }}>+ Добавить контакт</button>
          </>
        )}

        {tab === 'passport' && (
          <>
            {/* OCR-распознанная карточка паспорта */}
            <div style={{ ...ihProfStyles.card, padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: 12, padding: 14, borderBottom: '1px solid hsl(0 0% 94%)', alignItems: 'center' }}>
                <div style={{ width: 56, height: 72, borderRadius: 8, background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(24 95% 40%))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🛂</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '600 14px/1.3 Inter' }}>Загранпаспорт RU</div>
                  <div style={{ font: '400 12px/1.4 Inter', color: 'hsl(0 0% 45%)', marginTop: 2 }}>Распознан 14 мар 2026</div>
                </div>
                <span style={{ font: '500 11px/1 Inter', padding: '4px 8px', borderRadius: 9999, background: 'hsl(142 71% 45% / 0.12)', color: 'hsl(142 71% 30%)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10 }}>●</span> OCR 98%
                </span>
              </div>

              {/* Распознанные поля */}
              <div style={{ padding: '6px 14px 12px' }}>
                <div style={{ font: '500 11px/1 Inter', color: 'hsl(0 0% 45%)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 0 8px' }}>Распознанные данные</div>
                {[
                  { l: 'Серия и номер', v: '75 1234567', mono: true },
                  { l: 'Фамилия (lat.)', v: 'KUZNETSOVA' },
                  { l: 'Имя (lat.)', v: 'ANNA' },
                  { l: 'Пол', v: 'F / Жен.' },
                  { l: 'Дата рождения', v: '14.06.1987' },
                  { l: 'Место рождения', v: 'Г. МОСКВА' },
                  { l: 'Дата выдачи', v: '15.08.2021' },
                  { l: 'Действителен до', v: '14.08.2031', accent: true },
                  { l: 'Кем выдан', v: 'ФМС 770-094' },
                  { l: 'Гражданство', v: 'РОССИЯ / RUS' },
                ].map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', gap: 12,
                    padding: '8px 0', borderBottom: i < 9 ? '1px solid hsl(0 0% 96%)' : 'none',
                  }}>
                    <span style={{ font: '400 12px/1.4 Inter', color: 'hsl(0 0% 45%)', flexShrink: 0 }}>{f.l}</span>
                    <span style={{
                      font: f.mono
                        ? '500 13px/1.4 ui-monospace, "JetBrains Mono", monospace'
                        : '500 13px/1.4 Inter',
                      color: f.accent ? 'hsl(24 95% 38%)' : 'hsl(0 0% 9%)',
                      textAlign: 'right',
                    }}>{f.v}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, padding: '0 14px 14px' }}>
                <button style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'transparent', border: '1px solid hsl(0 0% 90%)', font: '500 12px/1 Inter', color: 'hsl(0 0% 9%)', cursor: 'pointer' }}>Исправить</button>
                <button style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'transparent', border: '1px solid hsl(0 0% 90%)', font: '500 12px/1 Inter', color: 'hsl(0 0% 9%)', cursor: 'pointer' }}>Просмотр скана</button>
              </div>
            </div>

            {/* Виза */}
            <div style={ihProfStyles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ font: '600 14px/1.3 Inter' }}>Виза India e-Tourist</div>
                  <div style={{ font: '400 12px/1.4 Inter', color: 'hsl(0 0% 45%)', marginTop: 2 }}>Распознана 18 мар 2026</div>
                </div>
                <span style={{ font: '500 11px/1 Inter', padding: '4px 8px', borderRadius: 9999, background: 'hsl(142 71% 45% / 0.12)', color: 'hsl(142 71% 30%)', alignSelf: 'flex-start' }}>✓ Активна</span>
              </div>
              {[
                { l: 'Номер визы', v: 'VN8473921', mono: true },
                { l: 'Тип', v: 'e-Tourist (30 дней)' },
                { l: 'Выдана', v: '18.03.2026' },
                { l: 'Истекает', v: '07.05.2026', accent: true },
                { l: 'Въездов', v: 'Двукратная' },
              ].map((f, i, a) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', gap: 12,
                  padding: '7px 0', borderBottom: i < a.length - 1 ? '1px solid hsl(0 0% 96%)' : 'none',
                }}>
                  <span style={{ font: '400 12px/1.4 Inter', color: 'hsl(0 0% 45%)' }}>{f.l}</span>
                  <span style={{
                    font: f.mono
                      ? '500 13px/1.4 ui-monospace, "JetBrains Mono", monospace'
                      : '500 13px/1.4 Inter',
                    color: f.accent ? 'hsl(24 95% 38%)' : 'hsl(0 0% 9%)',
                  }}>{f.v}</span>
                </div>
              ))}
            </div>

            <button style={{ ...ihProfStyles.saveBtn, background: 'transparent', color: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 90%)' }}>+ Загрузить документ</button>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { IHProfileScreen });
