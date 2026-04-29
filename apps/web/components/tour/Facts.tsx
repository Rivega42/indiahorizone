import { Bed, Calendar, Car, Clock, Headset, Users } from 'lucide-react';

import type { Tour } from '@/lib/mock/tours';

/**
 * Facts — 6 quick facts с иконками (#300).
 *
 * `iconKind` enum в данных тура → React-элемент через ICON_MAP. Расширение
 * (новый kind) — добавить запись в ICON_MAP. Пропущенный kind рендерится как
 * undefined (визуально пустая иконка) — не ломает layout.
 */

const ICON_MAP: Record<string, React.ReactElement> = {
  clock: <Clock className="h-5 w-5" aria-hidden />,
  users: <Users className="h-5 w-5" aria-hidden />,
  calendar: <Calendar className="h-5 w-5" aria-hidden />,
  bed: <Bed className="h-5 w-5" aria-hidden />,
  car: <Car className="h-5 w-5" aria-hidden />,
  headset: <Headset className="h-5 w-5" aria-hidden />,
};

export function Facts({ tour }: { tour: Tour }): React.ReactElement {
  return (
    <section className="border-y border-border bg-muted/40 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {tour.facts.map((fact) => (
            <div key={fact.label} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                {ICON_MAP[fact.iconKind]}
              </span>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {fact.label}
                </div>
                <div className="mt-0.5 font-medium">{fact.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
