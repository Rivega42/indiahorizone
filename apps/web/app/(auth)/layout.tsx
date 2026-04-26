import Link from 'next/link';

/**
 * Layout для (auth) route group: login / register / forgot-password / reset-password / suspicious-session.
 *
 * Centered card на нейтральном фоне. Mobile-first: padding 16px, max-width 420px.
 * Соответствует prototype'у в docs/UX/prototypes/from-claude-design/project/ui_kits/trip_dashboard/auth.html.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <main className="flex min-h-svh flex-col bg-muted/30">
      <header className="px-4 pt-8 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
        >
          <span aria-hidden>🇮🇳</span>
          <span>IndiaHorizone</span>
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </main>
  );
}
