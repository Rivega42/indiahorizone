import { ChevronDown, Leaf, Mountain, Music, Sparkles, UtensilsCrossed, Waves } from 'lucide-react';
import Image from 'next/image';

import { pluralizeDays, SectionHead } from './_shared';

import type { ActivityKind, Tour } from '@/lib/mock/tours';

/**
 * DayTimeline — программа по дням, accordion (#301).
 *
 * Native HTML `<details>` — без JS, ускоряет INP. Каждый день: image + description
 * раскрываются по тапу. Image lazy-loaded (sizes responsive).
 *
 * Title динамический по `tour.durationDays` — работает для разных туров (10-15 на старте).
 */

const ACTIVITY_ICONS: Record<ActivityKind, React.ReactElement> = {
  culture: <Music className="h-3.5 w-3.5" aria-hidden />,
  nature: <Leaf className="h-3.5 w-3.5" aria-hidden />,
  food: <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden />,
  water: <Waves className="h-3.5 w-3.5" aria-hidden />,
  adventure: <Mountain className="h-3.5 w-3.5" aria-hidden />,
  wellness: <Sparkles className="h-3.5 w-3.5" aria-hidden />,
};

export function DayTimeline({ tour }: { tour: Tour }): React.ReactElement {
  return (
    <section id="day-timeline" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead
          eyebrow="Программа"
          title={`${pluralizeDays(tour.durationDays)} — без хаоса, день за днём`}
          subtitle="Каждый день продуман: что смотрим, где живём, чем занимаемся. Опциональные активности можно поменять за день."
        />
        <div className="mt-14 space-y-3">
          {tour.days.map((day) => (
            <details
              key={day.dayNumber}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40"
            >
              <summary className="flex cursor-pointer list-none items-center gap-5 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-serif text-2xl font-medium text-primary">
                  {day.dayNumber}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    День {day.dayNumber} · {day.location}
                    {day.isOptional ? (
                      <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                        на выбор
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-1 font-serif text-xl font-medium leading-tight sm:text-2xl">
                    {day.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {day.activities.map((act, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs"
                      >
                        {ACTIVITY_ICONS[act.kind]}
                        {act.label}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronDown
                  className="h-5 w-5 text-muted-foreground transition group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="grid gap-6 px-5 pb-6 sm:grid-cols-2 sm:px-6">
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
                  <Image
                    src={day.imageUrl}
                    alt={`Фото: ${day.location}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {day.description}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
