// ChatScreen.jsx — IndiaHorizone #170
// «Realtime чат как в Telegram: bubbles, typing indicator, read-receipts, attachments, offline indicator»

const ihChatStyles = {
  page: { background: 'hsl(28 30% 96%)', minHeight: '100%', display: 'flex', flexDirection: 'column' },
  header: { padding: '10px 16px', background: '#fff', borderBottom: '1px solid hsl(0 0% 90%)', display: 'flex', alignItems: 'center', gap: 12 },
  back: { width: 28, height: 28, border: 'none', background: 'transparent', font: '500 18px/1 Inter', color: 'hsl(0 0% 9%)', cursor: 'pointer' },
  avatar: { width: 36, height: 36, borderRadius: 9999, background: 'hsl(24 95% 53% / 0.18)', color: 'hsl(24 95% 38%)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 13px/1 Inter' },
  hMain: { flex: 1, minWidth: 0 },
  hName: { font: '600 14px/1.2 Inter', color: 'hsl(0 0% 9%)' },
  hStatus: { font: '400 11px/1.4 Inter', color: 'hsl(142 71% 35%)', marginTop: 2 },
  hStatusOff: { color: 'hsl(0 0% 55%)' },
  hAction: { width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', font: '500 16px/1 Inter' },
  thread: { flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 6 },
  daySep: { alignSelf: 'center', font: '500 11px/1 Inter', color: 'hsl(0 0% 50%)', background: 'hsl(0 0% 100% / 0.7)', padding: '4px 10px', borderRadius: 9999, margin: '4px 0' },
  bubbleWrap: { display: 'flex', flexDirection: 'column', maxWidth: '78%' },
  bubbleWrapMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapThem: { alignSelf: 'flex-start' },
  bubble: { padding: '8px 12px', borderRadius: 14, font: '400 14px/1.4 Inter', wordWrap: 'break-word' },
  bubbleMe: { background: 'hsl(24 95% 53%)', color: '#fff', borderBottomRightRadius: 4 },
  bubbleThem: { background: '#fff', color: 'hsl(0 0% 9%)', borderBottomLeftRadius: 4, border: '1px solid hsl(0 0% 92%)' },
  meta: { display: 'flex', gap: 4, alignItems: 'center', marginTop: 3, font: '400 10px/1 Inter', color: 'hsl(0 0% 55%)' },
  attach: { width: 200, height: 130, background: 'linear-gradient(135deg, hsl(24 70% 60%), hsl(0 60% 50%))', borderRadius: 10, marginBottom: 4, display: 'flex', alignItems: 'flex-end', padding: 10, boxSizing: 'border-box', font: '500 11px/1 Inter', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.4)' },
  typing: { alignSelf: 'flex-start', background: '#fff', border: '1px solid hsl(0 0% 92%)', padding: '10px 14px', borderRadius: 14, borderBottomLeftRadius: 4, display: 'flex', gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 9999, background: 'hsl(0 0% 60%)' },
  composer: { background: '#fff', borderTop: '1px solid hsl(0 0% 90%)', padding: 10, display: 'flex', gap: 8, alignItems: 'flex-end' },
  attachBtn: { width: 36, height: 36, border: 'none', background: 'hsl(0 0% 96%)', borderRadius: 9999, cursor: 'pointer', font: '500 16px/1 Inter', color: 'hsl(0 0% 35%)', flexShrink: 0 },
  input: { flex: 1, font: '400 14px/1.4 Inter', padding: '9px 14px', border: '1px solid hsl(0 0% 90%)', borderRadius: 18, outline: 'none', resize: 'none', maxHeight: 100 },
  sendBtn: { width: 36, height: 36, border: 'none', background: 'hsl(24 95% 53%)', color: '#fff', borderRadius: 9999, cursor: 'pointer', font: '500 16px/1 Inter', flexShrink: 0 },
  offlineBanner: { background: 'hsl(38 92% 50% / 0.15)', color: 'hsl(38 92% 25%)', font: '500 12px/1.2 Inter', padding: '6px 14px', textAlign: 'center', borderBottom: '1px solid hsl(38 92% 50% / 0.3)' },
};

function IHReadReceipt({ status }) {
  if (status === 'sent') return <span style={{ opacity: 0.7 }}>✓</span>;
  if (status === 'delivered') return <span style={{ opacity: 0.7 }}>✓✓</span>;
  if (status === 'read') return <span style={{ color: 'hsl(195 90% 60%)' }}>✓✓</span>;
  return null;
}

function IHTypingDots() {
  return (
    <div style={ihChatStyles.typing}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          ...ihChatStyles.dot,
          animation: `ihTypingDot 1.2s ${i * 0.18}s infinite ease-in-out`,
        }} />
      ))}
    </div>
  );
}

const IH_THREAD = [
  { day: 'Сегодня' },
  { from: 'them', text: 'Доброе утро, Анна! Прия на связи. Как прошла ночь в Imperial?', t: '08:42', s: 'read' },
  { from: 'me', text: 'Спасибо, замечательно! Готовы выезжать к 10:30?', t: '08:51', s: 'read' },
  { from: 'them', text: 'Да, водитель уже в пути. На обед забронировала Pinch of Spice в Агре — рейтинг 4.8.', t: '08:53', s: 'read' },
  { from: 'me', attach: 'Селфи у бассейна', text: 'А я пока завтракаю 🌞', t: '09:04', s: 'read' },
  { from: 'them', text: 'Прекрасное место! Кстати, на закат в Тадж-Махал у нас слот 17:00 — по индийскому времени восход полной луны. Учтём?', t: '09:11', s: 'delivered' },
  { from: 'me', text: 'Конечно, давайте 🙏', t: 'сейчас', s: 'sent' },
];

function IHChatScreen({ offline = false, typing = true }) {
  const [text, setText] = React.useState('');
  return (
    <div style={ihChatStyles.page}>
      <style>{`@keyframes ihTypingDot { 0%, 60%, 100% { opacity: 0.3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }`}</style>
      <div style={ihChatStyles.header}>
        <button style={ihChatStyles.back}>←</button>
        <div style={ihChatStyles.avatar}>ПР</div>
        <div style={ihChatStyles.hMain}>
          <div style={ihChatStyles.hName}>Прия · concierge</div>
          <div style={{ ...ihChatStyles.hStatus, ...(offline ? ihChatStyles.hStatusOff : {}) }}>
            {offline ? '⚠ нет связи — отправим, когда появится' : typing ? 'печатает…' : 'в сети'}
          </div>
        </div>
        <button style={ihChatStyles.hAction}>📞</button>
        <button style={ihChatStyles.hAction}>⋯</button>
      </div>
      {offline && <div style={ihChatStyles.offlineBanner}>Без соединения · сообщения уйдут после восстановления</div>}

      <div style={ihChatStyles.thread}>
        {IH_THREAD.map((m, i) => {
          if (m.day) return <div key={i} style={ihChatStyles.daySep}>{m.day}</div>;
          const me = m.from === 'me';
          return (
            <div key={i} style={{ ...ihChatStyles.bubbleWrap, ...(me ? ihChatStyles.bubbleWrapMe : ihChatStyles.bubbleWrapThem) }}>
              {m.attach && <div style={ihChatStyles.attach}>📷 {m.attach}</div>}
              <div style={{ ...ihChatStyles.bubble, ...(me ? ihChatStyles.bubbleMe : ihChatStyles.bubbleThem) }}>
                {m.text}
              </div>
              <div style={ihChatStyles.meta}>
                <span>{m.t}</span>
                {me && <IHReadReceipt status={m.s} />}
              </div>
            </div>
          );
        })}
        {typing && !offline && <IHTypingDots />}
      </div>

      <div style={ihChatStyles.composer}>
        <button style={ihChatStyles.attachBtn}>📎</button>
        <textarea style={ihChatStyles.input} placeholder="Написать concierge…" rows={1} value={text} onChange={e => setText(e.target.value)} />
        <button style={ihChatStyles.sendBtn}>↑</button>
      </div>
    </div>
  );
}

Object.assign(window, { IHChatScreen });
