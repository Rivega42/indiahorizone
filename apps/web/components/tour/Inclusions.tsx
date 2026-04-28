import { Check, X } from 'lucide-react';

import { SectionHead } from './_shared';

import type { Tour } from '@/lib/mock/tours';

/**
 * Inclusions — что входит / не входит (#303).
 *
 * 2-column на ≥sm, single-column на mobile. Включено — зелёная галочка,
 * не включено — серый крестик. Прозрачность важна: «не включено» =
 * сознательное решение, не «забыли».
 */
export function Inclusions({ tour }: { tour: Tour }): React.ReactElement {
  return (
    <section className="border-y border-border bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead
          eyebrow="Что входит"
          title="Прозрачно: что включено, что — нет"
          subtitle="Не включённое — не «забыли», а сознательное решение. Помогаем по каждому пункту."
        />
        <div className="mt-12 grid gap-10 sm:grid-cols-2">
          <div>
            <h3 className="mb-5 flex items-center gap-2 font-serif text-xl font-medium">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-4 w-4" aria-hidden />
              </span>
              Включено
            </h3>
            <ul className="space-y-3 text-sm sm:text-base">
              {tour.inclusions.included.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-5 flex items-center gap-2 font-serif text-xl font-medium">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted-foreground/10 text-muted-foreground">
                <X className="h-4 w-4" aria-hidden />
              </span>
              Не включено
            </h3>
            <ul className="space-y-3 text-sm sm:text-base">
              {tour.inclusions.notIncluded.map((item) => (
                <li key={item} className="flex gap-3">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
