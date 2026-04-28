/**
 * Layout-обёртка для юридических страниц (#307).
 *
 * Применяется к /privacy, /consent, /offer внутри (legal)-route-group.
 * Группа не добавляет в URL — `/privacy`, не `/legal/privacy`.
 *
 * Стилистика: prose-классы (Tailwind typography) + узкая колонка для
 * читаемости длинного текста. Без хедера/футера сайта — фокус на тексте.
 */
import Link from 'next/link';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-serif text-xl text-foreground transition hover:text-primary"
          >
            India<em className="not-italic text-primary">Horizone</em>
          </Link>
          <nav className="flex gap-5 text-sm text-muted-foreground">
            <Link href="/privacy" className="transition hover:text-foreground">
              Конфиденциальность
            </Link>
            <Link href="/consent" className="transition hover:text-foreground">
              Согласие
            </Link>
            <Link href="/offer" className="transition hover:text-foreground">
              Оферта
            </Link>
          </nav>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">{children}</article>
    </main>
  );
}
