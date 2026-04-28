import Link from 'next/link';

/*
 * Dev-нав-страница: ссылки на все рабочие интерфейсы текущей фазы.
 * До полноценной маркетинговой главной (EPIC 13) — этот стартовый экран
 * помогает быстро открыть все доступные UI'и в одной сессии.
 */

interface Interface {
  href: string;
  external?: boolean;
  title: string;
  status: 'ready' | 'prototype' | 'in-progress';
  description: string;
  issue?: string;
}

const INTERFACES: Interface[] = [
  {
    href: '/prototypes/tour-landing/MOODBOARD.html',
    external: true,
    title: 'Tour Landing — Moodboard (Claude Design [12.D1])',
    status: 'prototype',
    description:
      '12 референсов luxury/adventure travel + 3 finalist (Black Tomato, Original Travel, Much Better Adventures). Палитра, tone of voice, anti-references.',
    issue: '#312 — done',
  },
  {
    href: '/prototypes/tour-landing/hero/Hero.html',
    external: true,
    title: 'Tour Landing — Hero «Керала», 3 варианта (Claude Design [12.D2])',
    status: 'prototype',
    description:
      'Design canvas с тремя desktop-вариантами Hero: V1 full-bleed cinematic, V2 split editorial, V3 immersive saffron sunset (рекомендуем). + Mobile со sticky CTA.',
    issue: '#313 — done',
  },
  {
    href: '/prototypes/tour-landing/timeline/Kerala.html',
    external: true,
    title: 'Tour Landing — полная страница «Керала» (Claude Design [12.D3])',
    status: 'prototype',
    description:
      'Hero V3 + DayTimeline композит — фактическая страница тура от дизайна. До интеграции в наш Next.js (предстоит замена /tours/[slug] под этот стиль).',
    issue: '#314 — partial',
  },
  {
    href: '/prototypes/homepage.html',
    external: true,
    title: 'Главная страница (Claude Design прототип)',
    status: 'prototype',
    description:
      '14 секций: Hero, Destinations, Tours, IndiaMap, Quiz, Reviews, Guides, Blog, Booking, FAQ. Saffron palette. Standalone HTML — без бэкенда.',
    issue: 'EPIC 13 (предстоит)',
  },
  {
    href: '/tours/tury-kerala-oktyabr-2026',
    title: 'Страница тура — Керала 10 дней (Next.js, наш стек)',
    status: 'in-progress',
    description:
      'Tour landing на Tailwind + shadcn: Hero, Facts, DayTimeline, Inclusions, PriceBlock+LeadForm, FAQ. Mock-данные. Будет переработана под дизайн [12.D2-D5] после утверждения.',
    issue: '#293 (EPIC 12)',
  },
  {
    href: '/login',
    title: 'Вход (Login)',
    status: 'ready',
    description: 'Форма входа с email/password, валидация, обработка ошибок API.',
    issue: '#271',
  },
  {
    href: '/register',
    title: 'Регистрация',
    status: 'ready',
    description: 'Регистрация нового клиента с password strength meter (zxcvbn).',
    issue: '#271',
  },
];

const STATUS_LABEL: Record<Interface['status'], string> = {
  ready: 'merged',
  prototype: 'prototype',
  'in-progress': 'WIP',
};

const STATUS_STYLE: Record<Interface['status'], string> = {
  ready: 'bg-success/10 text-success border-success/30',
  prototype: 'bg-info/10 text-info border-info/30',
  'in-progress': 'bg-warning/10 text-warning border-warning/30',
};

export default function HomePage(): React.ReactElement {
  return (
    <main className="min-h-svh bg-muted/30 px-6 py-12 sm:py-20">
      <div className="mx-auto max-w-3xl space-y-12">
        <header className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Dev navigation · Phase 3 Bootstrap
          </p>
          <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            India<em className="not-italic text-primary">Horizone</em> · все интерфейсы
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            Эта страница — временная dev-нав до запуска маркетинговой главной (EPIC 13). Здесь все
            UI текущей фазы — клик и смотри.
          </p>
        </header>

        <ul className="space-y-3">
          {INTERFACES.map((iface) => {
            const Wrap = ({ children }: { children: React.ReactNode }) =>
              iface.external ? (
                <a
                  href={iface.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md sm:p-6"
                >
                  {children}
                </a>
              ) : (
                <Link
                  href={iface.href}
                  className="block rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md sm:p-6"
                >
                  {children}
                </Link>
              );

            return (
              <li key={iface.href}>
                <Wrap>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-serif text-xl font-medium">{iface.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{iface.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        {iface.issue && (
                          <span className="font-mono text-muted-foreground">{iface.issue}</span>
                        )}
                        <span className="text-muted-foreground/60">·</span>
                        <span className="font-mono text-muted-foreground">{iface.href}</span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLE[iface.status]}`}
                    >
                      {STATUS_LABEL[iface.status]}
                    </span>
                  </div>
                </Wrap>
              </li>
            );
          })}
        </ul>

        <footer className="space-y-2 border-t border-border pt-8 text-xs text-muted-foreground">
          <p>
            <strong className="text-foreground">Документация:</strong>{' '}
            <code className="font-mono">docs/UX/DESIGN_SYSTEM.md</code> ·{' '}
            <code className="font-mono">docs/TZ/MVP_PHASE3.md</code> ·{' '}
            <code className="font-mono">docs/UX/prototypes/from-claude-design/homepage/</code>
          </p>
          <p>
            <strong className="text-foreground">Эпики:</strong> #293 (Tour Catalog), предстоят 13
            (Homepage), 14 (CRM), 15 (Trip Dashboard).
          </p>
        </footer>
      </div>
    </main>
  );
}
