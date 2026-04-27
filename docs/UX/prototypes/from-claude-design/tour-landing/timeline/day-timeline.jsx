// DayTimeline v3 — реальный маршрут 10 дней (Тривандрум → Поовар → Варкала → Понмуди → Каппил)
// Pinned-scroll: каждый день фиксируется, скролл переключает 2-4 внутренних слайда
// + Day-ladder слева: все 10 дней стопкой, активный увеличивается
// + Эффектный transition между днями (saffron-flash + zoom)

const DAYS = [
  {
    n: 1, place: 'Тривандрум', region: 'Прибытие · столица Кералы',
    slides: [
      {
        kind: 'arrival', label: 'Прилёт',
        title: 'Первый шаг по югу',
        text: 'Аэропорт Тривандрума. Тёплый влажный воздух, запах франжипани и моря. Трансфер в отель — 20 минут вдоль кокосовых пальм.',
        img: 'https://images.pexels.com/photos/4916559/pexels-photo-4916559.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'sight', label: 'Что увидите',
        title: 'Шри Падманабхасвами',
        text: 'Самый богатый храм мира. Древние подземные хранилища, золотые ворота, древняя резьба. Внутрь только в традиционной одежде.',
        img: 'https://images.pexels.com/photos/8112536/pexels-photo-8112536.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'evening', label: 'Вечер',
        title: 'Шоу Катхакали',
        text: '600-летний театр. Артист красит лицо при вас 2 часа, затем 90 минут разыгрывает древнюю историю — без слов, только глаза и руки.',
        img: 'https://images.pexels.com/photos/2837909/pexels-photo-2837909.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
    ],
  },
  {
    n: 2, place: 'Ковалам', region: 'Город + пляж',
    slides: [
      {
        kind: 'sight', label: 'Утро',
        title: 'Музей Напье',
        text: 'Индо-сарацинская архитектура XIX века. Бронзы, миниатюры, костюмы Катхакали. Час неспешно — и всё ясно про Кералу.',
        img: 'https://images.pexels.com/photos/14651113/pexels-photo-14651113.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'place', label: 'Дворец',
        title: 'Кутхирамалика',
        text: 'Дворец «Лошадиный» — 122 деревянных коня вдоль крыши. Резьба тика, музыкальные инструменты раджей, личные вещи династии.',
        img: 'https://images.pexels.com/photos/4916559/pexels-photo-4916559.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'evening', label: 'Закат',
        title: 'Маяк Ковалам',
        text: 'Красно-белая башня на скале. Подъём на 142 ступени — и весь Аравийский берег у ваших ног. Закат красит воду в saffron.',
        img: 'https://images.pexels.com/photos/2074313/pexels-photo-2074313.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
    ],
  },
  {
    n: 3, place: 'Поовар', region: 'Остров · мангровые заросли',
    slides: [
      {
        kind: 'place', label: 'Где будете',
        title: 'Лодочная прогулка',
        text: 'Деревянная лодка скользит между мангровыми корнями. Тишина — слышно только вёсла. Птицы-зимородки пикируют рядом.',
        img: 'https://images.pexels.com/photos/2087387/pexels-photo-2087387.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'activity', label: 'Что попробуете',
        title: 'Рыбалка с местными',
        text: 'Тонкая леска, простой крючок, никакой техники. Рыбаки покажут место — там, где впадает река в океан, рыба сама идёт.',
        img: 'https://images.pexels.com/photos/3601442/pexels-photo-3601442.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'food', label: 'Обед',
        title: 'Свежий улов',
        text: 'Что поймали — то и едите. Жарят на углях прямо на берегу, заворачивают в банановый лист с кокосом. Едите руками.',
        img: 'https://images.pexels.com/photos/14651113/pexels-photo-14651113.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
    ],
  },
  {
    n: 4, place: 'Варкала', region: 'Утёс над океаном',
    slides: [
      {
        kind: 'transit', label: 'Переезд',
        title: 'К утёсу',
        text: '60 км вдоль берега. Дорога вьётся через рыбацкие деревни, рисовые поля, пальмы. Заселение в лодж на самом краю утёса.',
        img: 'https://images.pexels.com/photos/1058959/pexels-photo-1058959.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'walk', label: 'Прогулка',
        title: 'Varkala Cliff',
        text: '40-метровый красный утёс из латерита нависает над океаном. Тропа сверху — 2 км маленьких кафе, лавок специй, йога-шал.',
        img: 'https://images.pexels.com/photos/2456348/pexels-photo-2456348.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'evening', label: 'Закат',
        title: 'Кафе на краю',
        text: 'Маленький бамбуковый стол, плед, фреш из лайма, закат без помех. Внизу — океан. За спиной — лампы, музыка, никто никуда не спешит.',
        img: 'https://images.pexels.com/photos/2074313/pexels-photo-2074313.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
    ],
  },
  {
    n: 5, place: 'Варкала', region: 'День океана',
    slides: [
      {
        kind: 'rest', label: 'Утро',
        title: 'Пляжный день',
        text: 'Без переездов. Завтрак на утёсе, спуск по лестнице на пляж. Тёплая вода, мягкие волны, тень от пальм.',
        img: 'https://images.pexels.com/photos/1078981/pexels-photo-1078981.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'activity', label: 'Активность',
        title: 'Серфинг и йога',
        text: 'Утром — йога на крыше с видом на океан. Днём — серфинг с инструктором. Волны Варкалы мягкие, идеальны для первого раза.',
        img: 'https://images.pexels.com/photos/4666749/pexels-photo-4666749.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'evening', label: 'Вечер',
        title: 'Аюрведа-массаж',
        text: 'Тёплое кокосовое масло, травяные компрессы, две пары рук одновременно. 90 минут — и неделя дороги уходит из тела.',
        img: 'https://images.pexels.com/photos/3735149/pexels-photo-3735149.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
    ],
  },
  {
    n: 6, place: 'Джатаю', region: 'Парк Земли · скалолазание',
    slides: [
      {
        kind: 'sight', label: 'Что увидите',
        title: 'Гигантская скульптура',
        text: 'Самая большая в мире скульптура птицы — 60 метров каменного орла Джатаю из Рамаяны. Лежит на скале на высоте 350 метров.',
        img: 'https://images.pexels.com/photos/1058959/pexels-photo-1058959.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'activity', label: 'Активность',
        title: 'Канатка и зиплайн',
        text: 'Канатная дорога к вершине через 3 холма. Затем зиплайн над долиной — 350 метров полёта. Внизу — джунгли и река.',
        img: 'https://images.pexels.com/photos/2456348/pexels-photo-2456348.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'climb', label: 'Скалолазание',
        title: 'На стенах Джатаю',
        text: 'Подготовленные маршруты с инструктором. Все уровни — от первого раза до опытных. Виды на закате того стоят.',
        img: 'https://images.pexels.com/photos/4666749/pexels-photo-4666749.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
    ],
  },
  {
    n: 7, place: 'Каппил', region: 'Храм · озеро · пляж',
    slides: [
      {
        kind: 'sight', label: 'Утро',
        title: 'Храм Джанарданасвами',
        text: '2000-летний храм Вишну на холме над морем. Маленький, древний, без туристов. Священник благословит — это занимает минуту.',
        img: 'https://images.pexels.com/photos/8112536/pexels-photo-8112536.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'activity', label: 'Каякинг',
        title: 'Озеро Каппил',
        text: 'Уникальное место — пресное озеро в 50 метрах от океана. Каяк скользит между лотосами. Рыбаки забрасывают сети с лодок.',
        img: 'https://images.pexels.com/photos/2087387/pexels-photo-2087387.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'evening', label: 'Пляж',
        title: 'Каппил-бич',
        text: 'Где озеро встречает океан — узкая золотая полоса. Здесь почти никого. Закат, песок, и линия, разделяющая два мира воды.',
        img: 'https://images.pexels.com/photos/2074313/pexels-photo-2074313.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
    ],
  },
  {
    n: 8, place: 'Понмуди', region: 'Горы · 1100 м',
    slides: [
      {
        kind: 'transit', label: 'Подъём',
        title: 'В горы',
        text: '22 серпантина за 90 минут. Воздух холодает, запах меняется на хвойный. Чайные плантации, тумaны, водопады по дороге.',
        img: 'https://images.pexels.com/photos/4666749/pexels-photo-4666749.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'choice', label: 'Выбор',
        title: 'Треккинг ИЛИ СПА',
        text: 'Активным — 8 км трек по облачному лесу с гидом. Тем, кто отдыхает — спа-день в эко-лодже: травяные ванны, паровая баня.',
        img: 'https://images.pexels.com/photos/4198936/pexels-photo-4198936.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
    ],
  },
  {
    n: 9, place: 'Возвращение', region: 'Дельфины · кухня · шопинг',
    slides: [
      {
        kind: 'morning', label: 'Утро',
        title: 'Дельфины',
        text: 'Выход в океан в 6 утра. Стая bottlenose-дельфинов идёт вдоль берега — играют у бортов лодки. Утренний свет, тишина, никаких туристов.',
        img: 'https://images.pexels.com/photos/3580384/pexels-photo-3580384.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'food', label: 'Кулинарный класс',
        title: 'Готовим по-кералински',
        text: 'У местного повара дома. Овощной curry, аviаl на 13 ингредиентов, рис matta. Учат складывать ладонь, чтобы рис не разваливался.',
        img: 'https://images.pexels.com/photos/14651113/pexels-photo-14651113.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
      {
        kind: 'shop', label: 'Шопинг',
        title: 'Специи и шёлк',
        text: 'Лавки кардамона, перца, ванили — настоящие, не туристические. Шёлк-канчипурам, медь, резное дерево. Концирж торгуется за вас.',
        img: 'https://images.pexels.com/photos/4198936/pexels-photo-4198936.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
    ],
  },
  {
    n: 10, place: 'Тривандрум', region: 'Домой',
    slides: [
      {
        kind: 'farewell', label: 'Прощание',
        title: 'Утренний рейс',
        text: 'Трансфер в аэропорт. Дома вы будете рассказывать про лодочника, повара и аюрведическую массажистку — а не про достопримечательности.',
        img: 'https://images.pexels.com/photos/1450363/pexels-photo-1450363.jpeg?auto=compress&cs=tinysrgb&w=2400',
      },
    ],
  },
];

const TOTAL_DAYS = DAYS.length;

// ============================================================
// Day-ladder — fixed left, all days stacked, current one expands
// ============================================================
const DayLadder = ({ activeDay }) => (
  <div style={{
    position: 'fixed', left: 56, top: '50%', transform: 'translateY(-50%)',
    zIndex: 30, pointerEvents: 'none',
    display: 'flex', flexDirection: 'column', gap: 4,
    fontFamily: 'Inter, sans-serif',
  }}>
    {DAYS.map((d) => {
      const isActive = d.n === activeDay;
      const isPast = d.n < activeDay;
      const distance = Math.abs(d.n - activeDay);
      return (
        <div key={d.n} style={{
          display: 'flex', alignItems: 'baseline', gap: 14,
          opacity: isActive ? 1 : (distance > 3 ? 0.18 : (0.55 - distance * 0.08)),
          transition: 'all 0.6s cubic-bezier(.2,.7,.2,1)',
          transform: isActive ? 'translateX(0)' : `translateX(${-distance * 2}px)`,
        }}>
          <span style={{
            fontSize: isActive ? 13 : 10,
            fontWeight: 600, letterSpacing: '0.18em',
            color: isActive ? 'hsl(24 95% 75%)' : (isPast ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.5)'),
            width: isActive ? 50 : 36,
            transition: 'all 0.6s cubic-bezier(.2,.7,.2,1)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            DAY {String(d.n).padStart(2,'0')}
          </span>
          <span style={{
            fontSize: isActive ? 30 : 13,
            fontWeight: isActive ? 600 : 400,
            letterSpacing: isActive ? '-0.02em' : '-0.005em',
            lineHeight: 1.1,
            color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
            transition: 'all 0.6s cubic-bezier(.2,.7,.2,1)',
            textShadow: isActive ? '0 2px 24px rgba(0,0,0,0.6)' : 'none',
          }}>
            {d.place}
          </span>
        </div>
      );
    })}
  </div>
);

// ============================================================
// DayPinned — sticky day with N inner slides driven by scroll
// ============================================================
const DayPinned = ({ day, onActiveChange, onSlideChange }) => {
  const wrapRef = React.useRef(null);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [transitionPhase, setTransitionPhase] = React.useState(0); // 0..1 — last 8% of day = exit phase
  const N = day.slides.length;

  React.useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = wrap.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = wrap.offsetHeight - vh;
        if (total <= 0) return;
        const scrolled = -r.top;
        const p = Math.max(0, Math.min(1, scrolled / total));

        // Determine slide idx with snap zones to avoid jumps
        // Each slide gets an equal portion 1/N. To prevent flicker at boundaries, use rounding.
        const raw = p * N;
        const idx = Math.min(N - 1, Math.max(0, Math.floor(raw - 0.0001)));
        setActiveIdx(idx);

        // Notify ladder which day is currently focused
        // "Current" if at least 30% of viewport is inside this day
        const isCurrent = r.top < vh * 0.5 && r.bottom > vh * 0.5;
        if (isCurrent) onActiveChange(day.n);

        // Transition phase: last 6% of the day
        const exitStart = 0.94;
        if (p > exitStart) {
          setTransitionPhase((p - exitStart) / (1 - exitStart));
        } else {
          setTransitionPhase(0);
        }

        if (onSlideChange) onSlideChange(day.n, idx, N);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [N, day.n, onActiveChange, onSlideChange]);

  // Click "Дальше" → scroll to next slide or next day
  const goNext = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const vh = window.innerHeight;
    const total = wrap.offsetHeight - vh;
    const slotSize = total / N;
    const targetSlot = activeIdx + 1;
    if (targetSlot >= N) {
      // jump to next day
      const next = wrap.nextElementSibling;
      if (next) next.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: wrap.offsetTop + wrap.offsetHeight, behavior: 'smooth' });
    } else {
      const targetTop = wrap.offsetTop + targetSlot * slotSize + 4;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  };

  // Image transform: subtle zoom while active, dramatic zoom-out on exit
  const exitScale = 1 + transitionPhase * 0.12;
  const exitOpacity = 1 - transitionPhase * 0.65;

  return (
    <div
      ref={wrapRef}
      data-screen-label={`Day ${String(day.n).padStart(2,'0')} ${day.place}`}
      style={{ position: 'relative', height: `${N * 100}vh` }}
    >
      <div style={{
        position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
        background: '#000',
      }}>
        {/* Layered images */}
        {day.slides.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            opacity: i === activeIdx ? exitOpacity : 0,
            transition: 'opacity 0.7s cubic-bezier(.2,.7,.2,1)',
          }}>
            <img
              src={s.img}
              alt={s.title}
              loading="lazy"
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                filter: 'saturate(1.08) contrast(1.04)',
                transform: i === activeIdx ? `scale(${1.04 * exitScale})` : 'scale(1.0)',
                transition: 'transform 4.5s cubic-bezier(.2,.7,.2,1)',
              }}
              onError={(e) => {
                if (!e.currentTarget.dataset.tried) {
                  e.currentTarget.dataset.tried = '1';
                  e.currentTarget.src = 'https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=2400';
                } else { e.currentTarget.style.display = 'none'; }
              }}
            />
          </div>
        ))}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%), linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.78) 100%)',
        }} />

        {/* Saffron-flash overlay during day-to-day transition */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 50%, hsla(24, 95%, 53%, ${transitionPhase * 0.45}) 0%, hsla(28, 80%, 60%, ${transitionPhase * 0.25}) 40%, transparent 75%)`,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          opacity: transitionPhase > 0 ? 1 : 0,
        }} />

        {/* Vignette black at bottom for fade-into-next-day */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, transparent ${100 - transitionPhase * 60}%, #000 100%)`,
          opacity: transitionPhase,
          pointerEvents: 'none',
        }} />

        {/* Big day number */}
        <div style={{
          position: 'absolute', right: -40, top: '50%', transform: 'translateY(-50%)',
          fontSize: 520, lineHeight: 0.85, fontWeight: 700, letterSpacing: '-0.06em',
          color: 'rgba(255,255,255,0.035)',
          fontFamily: 'Inter, sans-serif',
          pointerEvents: 'none', userSelect: 'none',
        }}>
          {String(day.n).padStart(2,'0')}
        </div>

        {/* CONTENT — slide cross-fade */}
        {day.slides.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', left: 380, bottom: 110, maxWidth: 640,
            opacity: i === activeIdx ? 1 : 0,
            transform: `translateY(${i === activeIdx ? 0 : 16}px)`,
            transition: 'opacity 0.6s cubic-bezier(.2,.7,.2,1), transform 0.6s cubic-bezier(.2,.7,.2,1)',
            pointerEvents: i === activeIdx ? 'auto' : 'none',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'hsl(24 95% 75%)', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ width: 24, height: 1, background: 'hsl(24 95% 65%)' }} />
              {s.label}
            </div>
            <h2 style={{
              fontSize: 64, lineHeight: 1.0, letterSpacing: '-0.035em',
              fontWeight: 600, margin: 0, color: '#fff',
              textWrap: 'balance',
            }}>
              {s.title}
            </h2>
            <p style={{
              fontSize: 17, lineHeight: 1.55, marginTop: 22, maxWidth: 540,
              color: 'rgba(255,255,255,0.86)', fontWeight: 400,
            }}>
              {s.text}
            </p>
          </div>
        ))}

        {/* Right indicator + next button */}
        <div style={{
          position: 'absolute', right: 64, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          zIndex: 5,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 500, letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums',
            marginBottom: 6,
          }}>
            {String(activeIdx + 1).padStart(2,'0')}/{String(N).padStart(2,'0')}
          </div>
          {day.slides.map((_, i) => (
            <div key={i} style={{
              width: 2, height: 28,
              background: i === activeIdx ? 'hsl(24 95% 53%)' : (i < activeIdx ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'),
              transition: 'background 0.4s',
              boxShadow: i === activeIdx ? '0 0 12px hsla(24,95%,53%,0.7)' : 'none',
            }} />
          ))}
        </div>

        {/* Bottom — day progress + next button */}
        <div style={{
          position: 'absolute', left: 380, right: 80, bottom: 36,
          display: 'flex', alignItems: 'center', gap: 20, zIndex: 5,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums',
          }}>
            {String(day.n).padStart(2,'0')} / {String(TOTAL_DAYS).padStart(2,'0')}
          </div>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)', position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${((day.n - 1 + (activeIdx + 1) / N) / TOTAL_DAYS) * 100}%`,
              background: 'hsl(24 95% 53%)',
              transition: 'width 0.6s cubic-bezier(.2,.7,.2,1)',
              boxShadow: '0 0 12px hsla(24, 95%, 53%, 0.5)',
            }} />
          </div>
          <button
            onClick={goNext}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(12px)',
              color: '#fff', fontSize: 12, fontWeight: 500,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              padding: '12px 22px', borderRadius: 999,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 10,
              transition: 'background 0.3s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsl(24 95% 53%)';
              e.currentTarget.style.borderColor = 'hsl(24 95% 53%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
          >
            {activeIdx === N - 1 ? 'Следующий день' : 'Дальше'}
            <span>↓</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// DayTimeline — main exported
// ============================================================
const DayTimeline = () => {
  const [activeDay, setActiveDay] = React.useState(1);

  return (
    <div style={{ background: '#000', position: 'relative' }}>
      {/* Section header */}
      <div style={{
        padding: '120px 80px 80px',
        background: 'linear-gradient(180deg, hsl(195 35% 8%) 0%, #000 100%)',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 36, height: 1, background: 'hsl(24 95% 65%)' }} />
          <div style={{
            fontSize: 12, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'hsl(24 95% 75%)',
          }}>
            Программа · 10 дней / 9 ночей
          </div>
        </div>
        <h2 style={{
          fontSize: 72, lineHeight: 1.0, letterSpacing: '-0.035em',
          fontWeight: 600, margin: 0, maxWidth: 900,
          textWrap: 'balance',
        }}>
          От первого <span style={{ fontStyle: 'italic', color: 'hsl(28 80% 75%)', fontWeight: 500 }}>chai</span> в Тривандруме —<br/>
          до последнего заката над морем.
        </h2>
        <p style={{
          fontSize: 17, lineHeight: 1.6, marginTop: 28, maxWidth: 640,
          color: 'rgba(255,255,255,0.7)',
        }}>
          Прокручивайте — день не закончится, пока не пройдёте все его моменты.
          Слева — карта дней, справа — где сейчас внутри дня.
        </p>
      </div>

      {/* Day-ladder fixed sidebar */}
      <DayLadder activeDay={activeDay} />

      {/* Pinned days */}
      {DAYS.map((day) => (
        <DayPinned
          key={day.n}
          day={day}
          onActiveChange={setActiveDay}
        />
      ))}

      {/* Closing */}
      <div style={{
        padding: '140px 80px',
        background: 'linear-gradient(180deg, #000 0%, hsl(195 35% 8%) 100%)',
        color: '#fff', textAlign: 'center',
      }}>
        <div style={{
          fontSize: 13, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'hsl(24 95% 75%)', marginBottom: 24,
        }}>
          Готовы спланировать свою?
        </div>
        <h2 style={{
          fontSize: 64, lineHeight: 1.0, letterSpacing: '-0.035em',
          fontWeight: 600, margin: 0, textWrap: 'balance', maxWidth: 900, marginInline: 'auto',
        }}>
          Это базовый маршрут.<br/>
          <span style={{ fontStyle: 'italic', fontWeight: 500, color: 'hsl(28 80% 75%)' }}>Ваш будет другим.</span>
        </h2>
        <p style={{
          fontSize: 17, lineHeight: 1.6, marginTop: 26, maxWidth: 540, marginInline: 'auto',
          color: 'rgba(255,255,255,0.7)',
        }}>
          Любой день можно растянуть, заменить или вписать сюда то,
          что важно именно вам. Концирж-команда соберёт под вас.
        </p>
        <button style={{
          marginTop: 44,
          background: 'hsl(24 95% 53%)', color: '#fff', border: 'none',
          padding: '20px 40px', borderRadius: 999, fontSize: 16, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px hsla(24, 95%, 53%, 0.45)',
        }}>
          Спланировать свой маршрут
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

window.DayTimeline = DayTimeline;
