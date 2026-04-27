// India Horizone — data
window.IH_DATA = {
  // Positioning tagline
  tagline: 'Индия без хаоса',
  subtag: 'Tech-enabled India concierge для русскоязычных клиентов',

  destinations: [
    { num: '01', name: 'Goa', sub: 'Берега бесконечного заката', tag: 'Coastal', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=900&q=80', days: '7 ночей', from: '89 000' },
    { num: '02', name: 'Kerala', sub: 'Зелёные воды бэкуотеров', tag: 'Tropical', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=900&q=80', days: '10 ночей', from: '124 000' },
    { num: '03', name: 'Rajasthan', sub: 'Пустыня дворцов и махараджей', tag: 'Heritage', img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=900&q=80', days: '12 ночей', from: '178 000' },
    { num: '04', name: 'Himalaya', sub: 'Небо на расстоянии вздоха', tag: 'Mountain', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=900&q=80', days: '14 ночей', from: '215 000' },
  ],
  tours: [
    {
      id: 't1', title: 'Золотой Треугольник Делюкс', loc: 'Дели · Агра · Джайпур',
      img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1000&q=80', category: 'heritage', duration: '9 дней', rating: 4.9, reviews: 312,
      tags: ['Тадж-Махал на рассвете', 'Форт Амбер', '5★ отели'],
      desc: 'Классика Индии в сопровождении частного гида-искусствоведа. Завтрак у подножия Тадж-Махала, ужин в фамильном хавели Раджастана.',
      price: '198 000', priceOld: '245 000', hot: true,
    },
    {
      id: 't2', title: 'Керала Рестарт', loc: 'Кочин · Аллеппи · Мунар',
      img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1000&q=80', category: 'wellness', duration: '11 дней', rating: 4.8, reviews: 187,
      tags: ['Аюрведа-ретрит', 'Хаусбот', 'Чайные плантации'],
      desc: 'Программа восстановления в аутентичной аюрведической клинике с доктором с 25-летним стажем. Массажи, диета, бэкуотеры.',
      price: '164 000',
    },
    {
      id: 't3', title: 'Гоа Премиум Рэтрит', loc: 'Северный Гоа · Южный Гоа',
      img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1000&q=80', category: 'beach', duration: '8 дней', rating: 4.7, reviews: 421,
      tags: ['Villa-отели', 'Closed beach', 'Private boat'],
      desc: 'Для тех, кому наскучил мейнстрим. Скрытые пляжи, винная сомелье-программа и яхтинг на закате.',
      price: '142 000', hot: true,
    },
    {
      id: 't4', title: 'Гималайская Одиссея', loc: 'Лех · Нуббра · Пангонг',
      img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1000&q=80', category: 'mountain', duration: '13 дней', rating: 5.0, reviews: 94,
      tags: ['Монастыри', 'Высота 5 300 м', 'Караван верблюдов'],
      desc: 'Экспедиция по Ладакху с акклиматизацией и посещением буддийских монастырей. Озёра такого цвета, что не верят камеры.',
      price: '289 000',
    },
    {
      id: 't5', title: 'Варанаси · Гангский ритуал', loc: 'Варанаси · Сарнатх',
      img: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1000&q=80', category: 'heritage', duration: '5 дней', rating: 4.9, reviews: 156,
      tags: ['Aarti на Ганге', 'Лодочный рассвет', 'Будда'],
      desc: 'Самый древний живой город планеты. Ритуалы огня, утренние медитации, частные лодки и чай в храмовых двориках.',
      price: '96 000',
    },
    {
      id: 't6', title: 'Раджастан Гранд Тур', loc: 'Удайпур · Джодхпур · Джайсалмер',
      img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1000&q=80', category: 'heritage', duration: '14 дней', rating: 4.9, reviews: 203,
      tags: ['3 дворца', 'Пустыня Тар', 'Верблюжий сафари'],
      desc: 'Город озёр, синий город и золотой город в одной нитке. Ночёвка в дюнах с приватным ужином под миллионом звёзд.',
      price: '234 000',
    },
  ],
  regions: [
    { id: 'himalaya', name: 'Himalaya', loc: 'Северная Индия', pin: [48, 18], desc: 'Высокогорные монастыри, бирюзовые озёра Ладакха и священные вершины.', stats: [['Пик', '7 816 м'], ['Туров', '12'], ['От', '₹215к']] },
    { id: 'rajasthan', name: 'Rajasthan', loc: 'Запад', pin: [25, 35], desc: 'Дворцы махараджей, розовые и синие города, пустыня Тар.', stats: [['Городов', '9'], ['Туров', '18'], ['От', '₹178к']] },
    { id: 'goa', name: 'Goa', loc: 'Западное побережье', pin: [22, 68], desc: 'Атлас португальского колониального наследия и бесконечных пляжей.', stats: [['Пляжей', '34'], ['Туров', '22'], ['От', '₹89к']] },
    { id: 'kerala', name: 'Kerala', loc: 'Юг', pin: [32, 82], desc: 'Тропические бэкуотеры, чайные плантации и аюрведические клиники.', stats: [['Клиник', '11'], ['Туров', '15'], ['От', '₹124к']] },
    { id: 'varanasi', name: 'Varanasi', loc: 'Север', pin: [58, 40], desc: 'Древнейший живой город на берегу священного Ганга.', stats: [['Гхатов', '88'], ['Туров', '7'], ['От', '₹96к']] },
  ],
  reviews: [
    { quote: 'Поездка, после которой жизнь действительно делится на «до» и «после». Команда продумала даже то, о чём я не спросила.', name: 'Анна Верьёвкина', trip: 'Раджастан · Март 2026', rating: 5, accent: true },
    { quote: 'За 20 лет путешествий это первая фирма, которая предложила маршрут лучше, чем я мог вообразить. Аюрведа в Керале — отдельная магия.', name: 'Дмитрий Северин', trip: 'Керала · Январь 2026', rating: 5 },
    { quote: 'Гималаи шокировали. Пангонг в 5 утра, приватные монастыри, безупречная логистика на высоте 5 000 метров.', name: 'Марина Куц', trip: 'Ладакх · Июль 2025', rating: 5 },
  ],
  guides: [
    { name: 'Арджун Мехра', role: 'Lead · North India', langs: ['RU', 'EN', 'HI'], img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80' },
    { name: 'Прия Айер', role: 'Wellness · Kerala', langs: ['RU', 'EN', 'ML'], img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=700&q=80' },
    { name: 'Тензин Вангчук', role: 'High altitude · Ladakh', langs: ['EN', 'HI', 'BO'], img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=700&q=80' },
    { name: 'Ракеш Саркар', role: 'Heritage · Rajasthan', langs: ['RU', 'EN', 'HI'], img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&q=80' },
  ],
  articles: [
    { cat: 'Guide', date: '14 апр 2026', readTime: '8 мин', title: 'Как выбрать сезон для Индии и не пожалеть', excerpt: 'Муссон, зной и золотое окно — три состояния Индии, определяющие совершенно разные путешествия.', img: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=900&q=80' },
    { cat: 'Story', date: '02 апр 2026', readTime: '12 мин', title: 'Один день в аюрведической клинике: изнутри', excerpt: 'Мы провели 24 часа в клинике доктора Наира и записали всё — от завтрака из кокоса до ночной медитации.', img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=900&q=80' },
    { cat: 'Essay', date: '21 мар 2026', readTime: '6 мин', title: 'Варанаси: почему этот город меняет людей', excerpt: 'Не каждый турист готов к Варанаси. Разбираемся, зачем ехать и как не сломаться об интенсивность.', img: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=900&q=80' },
  ],
  quiz: [
    {
      q: 'Какое путешествие ты ищешь?',
      hint: 'Помогает нам подобрать тон и темп поездки.',
      opts: [
        { k: 'A', t: 'Перезагрузка', d: 'Йога, аюрведа, природа, медитации' },
        { k: 'B', t: 'Культура', d: 'Дворцы, храмы, гид-искусствовед' },
        { k: 'C', t: 'Приключение', d: 'Высота, треки, необычные маршруты' },
        { k: 'D', t: 'Роскошь', d: 'Heritage-отели, приватные трансферы' },
      ],
    },
    {
      q: 'Сколько длится поездка?',
      hint: 'От 5 дней до 3 недель — формат определит насыщенность.',
      opts: [
        { k: 'A', t: '5–7 дней', d: 'Одно направление, высокая концентрация' },
        { k: 'B', t: '8–12 дней', d: 'Классический формат, 2–3 точки' },
        { k: 'C', t: '13–16 дней', d: 'Глубокое погружение, 3–4 региона' },
        { k: 'D', t: '17+ дней', d: 'Тотальный Гранд Тур' },
      ],
    },
    {
      q: 'Размер группы?',
      hint: 'Путешествие строится вокруг ваших привычек.',
      opts: [
        { k: 'A', t: 'Соло', d: 'Личный темп и свобода' },
        { k: 'B', t: 'Пара', d: 'Романтический подбор отелей' },
        { k: 'C', t: 'Семья', d: 'Дети, экскурсии, безопасность' },
        { k: 'D', t: 'Компания 5+', d: 'Приватные трансферы и виллы' },
      ],
    },
    {
      q: 'Уровень комфорта?',
      hint: 'От уютных гестхаусов до закрытых резиденций.',
      opts: [
        { k: 'A', t: 'Авторский', d: 'Буду в гестхаусах, хочу аутентичность' },
        { k: 'B', t: 'Комфорт 4★', d: 'Проверенные отели с базовым сервисом' },
        { k: 'C', t: 'Премиум 5★', d: 'Лучшие бренды и heritage-отели' },
        { k: 'D', t: 'Private estate', d: 'Виллы, резиденции, персонал' },
      ],
    },
  ],

  // Hero cards — real images
  heroImages: {
    main: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=700&q=80',
    back: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=700&q=80',
  },
};

// Patch image URLs with bundled blob URLs if available
(function patchImgs() {
  const map = {"https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=900&q=80":"img00","https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=900&q=80":"img01","https://images.unsplash.com/photo-1477587458883-47145ed94245?w=900&q=80":"img02","https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=900&q=80":"img03","https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1000&q=80":"img04","https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1000&q=80":"img05","https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1000&q=80":"img06","https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1000&q=80":"img07","https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1000&q=80":"img08","https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1000&q=80":"img09","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80":"img10","https://images.unsplash.com/photo-1580489944761-15a19d654956?w=700&q=80":"img11","https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=700&q=80":"img12","https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&q=80":"img13","https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=900&q=80":"img14","https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=900&q=80":"img15","https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=900&q=80":"img16","https://images.unsplash.com/photo-1477587458883-47145ed94245?w=700&q=80":"img17","https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=700&q=80":"img18","https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=900&q=85":"img19","https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1000&q=85":"img20","https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1000&q=85":"img21"};
  const res = window.__resources || {};
  function fix(u) { const id = map[u]; return (id && res[id]) ? res[id] : u; }
  const d = window.IH_DATA;
  if (d.destinations) d.destinations.forEach(x => { if (x.img) x.img = fix(x.img); });
  if (d.tours) d.tours.forEach(x => { if (x.img) x.img = fix(x.img); });
  if (d.guides) d.guides.forEach(x => { if (x.img) x.img = fix(x.img); });
  if (d.articles) d.articles.forEach(x => { if (x.img) x.img = fix(x.img); });
  if (d.heroImages) { d.heroImages.main = fix(d.heroImages.main); d.heroImages.back = fix(d.heroImages.back); }
})();
