// AuthScreens.jsx — IndiaHorizone #135 (B-010 + B-008 + B-011)
// Login / Register / 2FA-setup / 2FA-challenge / Forgot / Reset / Suspicious

const ihAuthStyles = {
  page: { background: 'hsl(0 0% 98%)', minHeight: '100%', display: 'flex', flexDirection: 'column' },
  container: { padding: '24px 20px 32px', flex: 1, display: 'flex', flexDirection: 'column' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 },
  mark: { width: 32, height: 32, borderRadius: 8, background: 'hsl(24 95% 53%)', color: '#fff', font: '700 14px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  word: { font: '600 17px/1 Inter', color: 'hsl(0 0% 9%)', letterSpacing: '-0.02em' },
  title: { font: '600 24px/1.2 Inter', color: 'hsl(0 0% 9%)', letterSpacing: '-0.015em', marginBottom: 6 },
  sub: { font: '400 14px/1.5 Inter', color: 'hsl(0 0% 45%)', marginBottom: 20 },
  field: { marginBottom: 14 },
  label: { display: 'block', font: '500 13px/1.2 Inter', color: 'hsl(0 0% 9%)', marginBottom: 6 },
  input: { width: '100%', boxSizing: 'border-box', font: '400 15px/1.4 Inter', padding: '12px 14px', border: '1px solid hsl(0 0% 90%)', borderRadius: 10, background: '#fff', outline: 'none' },
  helper: { font: '400 12px/1.4 Inter', color: 'hsl(0 0% 45%)', marginTop: 6 },
  primaryBtn: { width: '100%', padding: '14px', borderRadius: 10, background: 'hsl(24 95% 53%)', color: '#fff', border: 'none', font: '500 15px/1 Inter', cursor: 'pointer', marginTop: 8 },
  ghostBtn: { width: '100%', padding: '12px', borderRadius: 10, background: 'transparent', color: 'hsl(0 0% 9%)', border: 'none', font: '500 14px/1 Inter', cursor: 'pointer', marginTop: 8 },
  outlineBtn: { width: '100%', padding: '12px', borderRadius: 10, background: 'transparent', color: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 90%)', font: '500 14px/1 Inter', cursor: 'pointer', marginTop: 8 },
  switcher: { display: 'flex', gap: 4, padding: 4, background: 'hsl(0 0% 96%)', borderRadius: 12, marginBottom: 20 },
  tab: { flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', font: '500 13px/1 Inter', color: 'hsl(0 0% 45%)', cursor: 'pointer' },
  tabActive: { background: '#fff', color: 'hsl(0 0% 9%)', boxShadow: '0 1px 2px hsl(0 0% 0% / 0.05)' },
  errBanner: { background: 'hsl(0 84% 60% / 0.08)', border: '1px solid hsl(0 84% 60% / 0.25)', color: 'hsl(0 70% 35%)', padding: '10px 12px', borderRadius: 10, font: '500 12px/1.4 Inter', marginBottom: 14 },
  okBanner: { background: 'hsl(142 71% 45% / 0.08)', border: '1px solid hsl(142 71% 45% / 0.25)', color: 'hsl(142 71% 25%)', padding: '10px 12px', borderRadius: 10, font: '500 12px/1.4 Inter', marginBottom: 14 },
};

function IHPasswordMeter({ value }) {
  const score = (() => {
    let s = 0;
    if (value.length >= 8) s++;
    if (value.length >= 12) s++;
    if (/[A-ZА-Я]/.test(value) && /[a-zа-я]/.test(value)) s++;
    if (/\d/.test(value) && /[^A-Za-zА-Яа-я0-9]/.test(value)) s++;
    return Math.min(4, s);
  })();
  const labels = ['', 'Слабый', 'Средний', 'Хороший', 'Отличный'];
  const colors = ['hsl(0 0% 90%)', 'hsl(0 84% 60%)', 'hsl(38 92% 50%)', 'hsl(48 90% 50%)', 'hsl(142 71% 45%)'];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? colors[score] : 'hsl(0 0% 92%)' }} />
        ))}
      </div>
      {value && <div style={{ font: '400 12px/1.4 Inter', color: colors[score], marginTop: 6 }}>{labels[score]} пароль · мин. 12 символов</div>}
    </div>
  );
}

function IHAuthBrand() {
  return (
    <div style={ihAuthStyles.brand}>
      <div style={ihAuthStyles.mark}>IH</div>
      <div style={ihAuthStyles.word}>India<span style={{ color: 'hsl(24 95% 53%)' }}>Horizone</span></div>
    </div>
  );
}

function IHCodeInput({ length = 6, value, onChange }) {
  const refs = React.useRef([]);
  const arr = (value + '......').slice(0, length).split('').map(c => c === '.' ? '' : c);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {arr.map((c, i) => (
        <input key={i} ref={el => refs.current[i] = el} maxLength={1} value={c}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 1);
            const next = (value + ' '.repeat(length)).slice(0, length).split('');
            next[i] = v || '';
            onChange(next.join('').replace(/ /g, ''));
            if (v && i < length - 1) refs.current[i + 1]?.focus();
          }}
          style={{ ...ihAuthStyles.input, textAlign: 'center', font: '600 18px/1.2 ui-monospace, "JetBrains Mono", monospace', padding: '12px 0' }} />
      ))}
    </div>
  );
}

function IHLoginScreen({ onSwitch, onSubmit }) {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  return (
    <div style={ihAuthStyles.container}>
      <IHAuthBrand />
      <div style={ihAuthStyles.title}>С возвращением</div>
      <div style={ihAuthStyles.sub}>Войдите в Trip Dashboard</div>
      <div style={ihAuthStyles.switcher}>
        <button style={{ ...ihAuthStyles.tab, ...ihAuthStyles.tabActive }}>Вход</button>
        <button style={ihAuthStyles.tab} onClick={() => onSwitch('register')}>Регистрация</button>
      </div>
      <div style={ihAuthStyles.field}>
        <label style={ihAuthStyles.label}>Email</label>
        <input style={ihAuthStyles.input} type="email" placeholder="вы@почта.рф" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div style={ihAuthStyles.field}>
        <label style={ihAuthStyles.label}>Пароль</label>
        <input style={ihAuthStyles.input} type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} />
        <a style={{ ...ihAuthStyles.helper, color: 'hsl(24 95% 38%)', textDecoration: 'none', display: 'inline-block', marginTop: 8 }} href="#" onClick={e => { e.preventDefault(); onSwitch('forgot'); }}>Забыли пароль?</a>
      </div>
      <button style={ihAuthStyles.primaryBtn} onClick={() => onSubmit && onSubmit({ email, pw })}>Войти</button>
      <button style={ihAuthStyles.ghostBtn} onClick={() => onSwitch('register')}>У меня ещё нет аккаунта</button>
    </div>
  );
}

function IHRegisterScreen({ onSwitch, onSubmit }) {
  const [d, setD] = React.useState({ name: '', email: '', pw: '' });
  const upd = (k, v) => setD(s => ({ ...s, [k]: v }));
  return (
    <div style={ihAuthStyles.container}>
      <IHAuthBrand />
      <div style={ihAuthStyles.title}>Создайте аккаунт</div>
      <div style={ihAuthStyles.sub}>Доступ к маршруту, документам, concierge</div>
      <div style={ihAuthStyles.switcher}>
        <button style={ihAuthStyles.tab} onClick={() => onSwitch('login')}>Вход</button>
        <button style={{ ...ihAuthStyles.tab, ...ihAuthStyles.tabActive }}>Регистрация</button>
      </div>
      <div style={ihAuthStyles.field}><label style={ihAuthStyles.label}>Имя</label><input style={ihAuthStyles.input} placeholder="Анна" value={d.name} onChange={e => upd('name', e.target.value)} /></div>
      <div style={ihAuthStyles.field}><label style={ihAuthStyles.label}>Email</label><input style={ihAuthStyles.input} type="email" placeholder="вы@почта.рф" value={d.email} onChange={e => upd('email', e.target.value)} /></div>
      <div style={ihAuthStyles.field}>
        <label style={ihAuthStyles.label}>Пароль</label>
        <input style={ihAuthStyles.input} type="password" placeholder="Минимум 12 символов" value={d.pw} onChange={e => upd('pw', e.target.value)} />
        <IHPasswordMeter value={d.pw} />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 8 }}>
        <input type="checkbox" defaultChecked style={{ marginTop: 3 }} />
        <div style={{ font: '400 12px/1.5 Inter', color: 'hsl(0 0% 45%)' }}>
          Принимаю <a href="#" style={{ color: 'hsl(24 95% 38%)' }}>оферту</a> и <a href="#" style={{ color: 'hsl(24 95% 38%)' }}>политику данных</a>
        </div>
      </div>
      <button style={ihAuthStyles.primaryBtn} onClick={() => onSubmit && onSubmit(d)}>Создать аккаунт</button>
    </div>
  );
}

// 2FA setup (B-007): QR + recovery codes (одноразовый показ + скачать)
function IH2FASetupScreen({ onDone }) {
  const [step, setStep] = React.useState('qr'); // qr → verify → codes
  const [code, setCode] = React.useState('');
  const codes = ['4f8a-c2d1', '9b3e-7a05', '1c4d-ee82', '6f70-12bb', 'aa39-d840', 'b215-65fc', 'd942-ab10', '5e8c-3f29', '7102-cd44', 'fe1a-9b88'];
  const downloadCodes = () => {
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'indiahorizone-recovery.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'codes') {
    return (
      <div style={ihAuthStyles.container}>
        <IHAuthBrand />
        <div style={ihAuthStyles.title}>Recovery-коды</div>
        <div style={ihAuthStyles.sub}>10 одноразовых кодов. Покажем один раз — сохраните сейчас.</div>
        <div style={ihAuthStyles.errBanner}>
          ⚠ После закрытия экрана коды нельзя будет посмотреть снова. Сгенерируйте новые в настройках, если потеряете.
        </div>
        <div style={{ background: 'hsl(0 0% 96%)', borderRadius: 10, padding: 14, marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, font: '500 13px/1.6 ui-monospace, "JetBrains Mono", monospace' }}>
          {codes.map(c => <span key={c}>{c}</span>)}
        </div>
        <button style={ihAuthStyles.outlineBtn} onClick={downloadCodes}>📥 Скачать .txt</button>
        <button style={ihAuthStyles.primaryBtn} onClick={() => onDone && onDone()}>Я сохранил коды</button>
      </div>
    );
  }

  return (
    <div style={ihAuthStyles.container}>
      <IHAuthBrand />
      <div style={ihAuthStyles.title}>Настройка 2FA</div>
      <div style={ihAuthStyles.sub}>Отсканируйте QR в Google Authenticator / Authy и введите код</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <div style={{ width: 168, height: 168, background: '#fff', border: '1px solid hsl(0 0% 90%)', borderRadius: 12, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: 1 }}>
          {Array.from({ length: 225 }).map((_, i) => {
            const seed = (i * 17 + (i % 7) * 13) % 100;
            const corner = (i < 31 || (i % 15) < 4 || (i % 15) > 10 || (i > 195 && i < 226 && (i % 15) < 4));
            return <div key={i} style={{ background: (seed > 50 || corner) ? '#000' : 'transparent' }} />;
          })}
        </div>
      </div>
      <div style={{ font: '400 12px/1.4 Inter', color: 'hsl(0 0% 45%)', textAlign: 'center', marginBottom: 14 }}>
        Или введите вручную: <span style={{ font: '500 12px/1 ui-monospace, "JetBrains Mono", monospace', color: 'hsl(0 0% 9%)' }}>JBSWY3DPEHPK3PXP</span>
      </div>
      <div style={ihAuthStyles.field}>
        <label style={ihAuthStyles.label}>Код из приложения</label>
        <IHCodeInput value={code} onChange={setCode} />
      </div>
      <button style={ihAuthStyles.primaryBtn} onClick={() => setStep('codes')} disabled={code.length < 6}>Подтвердить и получить recovery-коды</button>
    </div>
  );
}

// 2FA challenge (B-008): после login, если включён 2FA
function IH2FAChallengeScreen({ onVerify, onSwitch }) {
  const [code, setCode] = React.useState('');
  const [recovery, setRecovery] = React.useState(false);
  const [recCode, setRecCode] = React.useState('');
  return (
    <div style={ihAuthStyles.container}>
      <IHAuthBrand />
      <div style={ihAuthStyles.title}>Подтвердите вход</div>
      <div style={ihAuthStyles.sub}>{recovery ? 'Введите recovery-код' : 'Введите 6-значный код из вашего authenticator'}</div>
      {!recovery ? (
        <>
          <div style={ihAuthStyles.field}>
            <label style={ihAuthStyles.label}>Код</label>
            <IHCodeInput value={code} onChange={setCode} />
            <div style={ihAuthStyles.helper}>Срок действия challenge — 5 минут</div>
          </div>
          <button style={ihAuthStyles.primaryBtn} onClick={() => onVerify && onVerify(code)} disabled={code.length < 6}>Войти</button>
          <button style={ihAuthStyles.ghostBtn} onClick={() => setRecovery(true)}>Использовать recovery-код</button>
        </>
      ) : (
        <>
          <div style={ihAuthStyles.field}>
            <label style={ihAuthStyles.label}>Recovery-код (например, 4f8a-c2d1)</label>
            <input style={{ ...ihAuthStyles.input, font: '500 14px/1.4 ui-monospace, monospace' }} placeholder="xxxx-xxxx" value={recCode} onChange={e => setRecCode(e.target.value)} />
            <div style={ihAuthStyles.helper}>Код одноразовый — после использования будет недействителен</div>
          </div>
          <button style={ihAuthStyles.primaryBtn} onClick={() => onVerify && onVerify(recCode)}>Войти</button>
          <button style={ihAuthStyles.ghostBtn} onClick={() => setRecovery(false)}>Назад к коду из приложения</button>
        </>
      )}
    </div>
  );
}

// Forgot password (B-009): запрос email
function IHForgotScreen({ onSwitch, onSent }) {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  return (
    <div style={ihAuthStyles.container}>
      <IHAuthBrand />
      <div style={ihAuthStyles.title}>Восстановление пароля</div>
      <div style={ihAuthStyles.sub}>Отправим ссылку на email. Действительна 30 минут.</div>
      {sent ? (
        <>
          <div style={ihAuthStyles.okBanner}>
            ✓ Если такой email зарегистрирован — письмо со ссылкой уже в пути. Проверьте почту и спам.
          </div>
          <button style={ihAuthStyles.outlineBtn} onClick={() => onSwitch('login')}>Вернуться ко входу</button>
        </>
      ) : (
        <>
          <div style={ihAuthStyles.field}>
            <label style={ihAuthStyles.label}>Email от аккаунта</label>
            <input style={ihAuthStyles.input} type="email" placeholder="вы@почта.рф" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <button style={ihAuthStyles.primaryBtn} onClick={() => setSent(true)} disabled={!email.includes('@')}>Отправить ссылку</button>
          <button style={ihAuthStyles.ghostBtn} onClick={() => onSwitch('login')}>Вспомнил, вернуться</button>
        </>
      )}
    </div>
  );
}

// Reset password (B-009): по ссылке из письма
function IHResetScreen({ onSwitch }) {
  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const [done, setDone] = React.useState(false);
  const mismatch = pw && pw2 && pw !== pw2;
  return (
    <div style={ihAuthStyles.container}>
      <IHAuthBrand />
      <div style={ihAuthStyles.title}>Новый пароль</div>
      <div style={ihAuthStyles.sub}>После сохранения вы выйдете со всех устройств.</div>
      {done ? (
        <>
          <div style={ihAuthStyles.okBanner}>✓ Пароль обновлён. Все сессии завершены — войдите заново.</div>
          <button style={ihAuthStyles.primaryBtn} onClick={() => onSwitch('login')}>Войти</button>
        </>
      ) : (
        <>
          <div style={ihAuthStyles.field}>
            <label style={ihAuthStyles.label}>Новый пароль</label>
            <input style={ihAuthStyles.input} type="password" placeholder="Минимум 12 символов" value={pw} onChange={e => setPw(e.target.value)} />
            <IHPasswordMeter value={pw} />
          </div>
          <div style={ihAuthStyles.field}>
            <label style={ihAuthStyles.label}>Повторите пароль</label>
            <input style={ihAuthStyles.input} type="password" value={pw2} onChange={e => setPw2(e.target.value)} />
            {mismatch && <div style={{ ...ihAuthStyles.helper, color: 'hsl(0 70% 45%)' }}>Пароли не совпадают</div>}
          </div>
          <button style={ihAuthStyles.primaryBtn} onClick={() => setDone(true)} disabled={pw.length < 12 || mismatch}>Сохранить пароль</button>
        </>
      )}
    </div>
  );
}

// Suspicious-session (B-011)
function IHSuspiciousScreen({ onSwitch }) {
  const [resolved, setResolved] = React.useState(null); // 'me' | 'notme'
  if (resolved === 'me') {
    return (
      <div style={ihAuthStyles.container}>
        <IHAuthBrand />
        <div style={ihAuthStyles.okBanner}>✓ Спасибо. Сессия помечена как доверенная.</div>
        <button style={ihAuthStyles.primaryBtn} onClick={() => onSwitch('login')}>На главную</button>
      </div>
    );
  }
  if (resolved === 'notme') {
    return (
      <div style={ihAuthStyles.container}>
        <IHAuthBrand />
        <div style={ihAuthStyles.errBanner}>⚠ Все сессии завершены. Установите новый пароль.</div>
        <button style={ihAuthStyles.primaryBtn} onClick={() => onSwitch('reset')}>Сменить пароль</button>
      </div>
    );
  }
  return (
    <div style={ihAuthStyles.container}>
      <IHAuthBrand />
      <div style={ihAuthStyles.title}>Новый вход в аккаунт</div>
      <div style={ihAuthStyles.sub}>Мы заметили необычный вход — это были вы?</div>
      <div style={{ background: '#fff', border: '1px solid hsl(0 0% 90%)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        {[
          { l: 'Когда', v: 'Сегодня в 14:32 МСК' },
          { l: 'Откуда', v: '🇮🇳 Гоа, Индия · IP 49.205.xx.xx' },
          { l: 'Устройство', v: 'iPhone · Safari 17' },
          { l: 'Прежний вход', v: '🇷🇺 Москва, 3 дня назад' },
        ].map((r, i, a) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < a.length - 1 ? '1px solid hsl(0 0% 96%)' : 'none' }}>
            <span style={{ font: '400 12px/1.4 Inter', color: 'hsl(0 0% 45%)' }}>{r.l}</span>
            <span style={{ font: '500 13px/1.4 Inter', color: 'hsl(0 0% 9%)', textAlign: 'right' }}>{r.v}</span>
          </div>
        ))}
      </div>
      <button style={ihAuthStyles.primaryBtn} onClick={() => setResolved('me')}>Это был я</button>
      <button style={{ ...ihAuthStyles.outlineBtn, borderColor: 'hsl(0 84% 60%)', color: 'hsl(0 70% 35%)' }} onClick={() => setResolved('notme')}>Это не я — заблокировать</button>
    </div>
  );
}

Object.assign(window, {
  IHLoginScreen, IHRegisterScreen, IH2FASetupScreen, IH2FAChallengeScreen,
  IHForgotScreen, IHResetScreen, IHSuspiciousScreen, IHPasswordMeter,
});
