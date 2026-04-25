export default function HomePage(): React.ReactElement {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          🇮🇳 Phase 3 · Bootstrap
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          IndiaHorizone — Trip Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          Клиентский кабинет: маршрут, документы, кружок-фидбэк, SOS — всё под рукой
          даже без интернета.
        </p>
        <p className="text-sm text-muted-foreground">
          Это пустой scaffold. Реальные экраны появятся в следующих slice&apos;ах backlog M5
          (см. issues #154, #155, #156, #170, #198 и др.).
        </p>
      </div>
    </main>
  );
}
