import { SectionHead } from './_shared';

import type { Tour } from '@/lib/mock/tours';

/**
 * Reviews — текстовые отзывы клиентов (#302, V1 без видео-кружков).
 *
 * Caller должен сам skip'ать рендер если `tour.reviews.length === 0` —
 * показывать пустую секцию с placeholder'ом anti-trust (см. TOUR_LANDING.md).
 *
 * V2 (#287, #315): после накопления — расширить до видео-карусели.
 */
export function Reviews({ tour }: { tour: Tour }): React.ReactElement {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead
          eyebrow="Отзывы"
          title="Что говорят клиенты"
          subtitle="Только реальные отзывы с consent. Появятся после первых поездок."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tour.reviews.map((r) => (
            <article key={r.authorName} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex gap-0.5 text-primary">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="mb-5 leading-relaxed">«{r.quote}»</p>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                  {r.authorName[0]}
                </div>
                <div>
                  <div className="font-medium">{r.authorName}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.city} · {r.tripDate}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
