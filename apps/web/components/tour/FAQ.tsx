import { ChevronDown } from 'lucide-react';

import { SectionHead } from './_shared';

import type { Tour } from '@/lib/mock/tours';

/**
 * FAQ — частые вопросы, accordion (#305).
 *
 * Native `<details>` без JS. Q/A также рендерится в Schema.org FAQPage
 * JSON-LD на уровне страницы (см. lib/seo/tour-jsonld.ts) — Яндекс/Google
 * показывает expandable вопросы прямо в выдаче.
 */
export function FAQ({ tour }: { tour: Tour }): React.ReactElement {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHead
          eyebrow="Вопросы"
          title="Что обычно спрашивают"
          subtitle="Если вашего вопроса нет — напишите в Telegram, ответим за 2 часа."
          align="center"
        />
        <div className="mt-12 space-y-3">
          {tour.faq.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border bg-card transition hover:border-primary/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
                <span className="font-medium">{item.q}</span>
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-muted-foreground transition group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
