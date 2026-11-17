import type { EventInfo } from '../types'

interface EventHeroProps {
  event: EventInfo
}

export function EventHero({ event }: EventHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-[1.75rem] bg-wine px-6 py-8 text-cream shadow-[0_24px_60px_-28px_rgba(92,21,48,0.55)] sm:px-8 sm:py-10">
      <div
        className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-rose/30 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-8 h-52 w-52 rounded-full bg-blush/25 blur-2xl"
        aria-hidden="true"
      />

      <p className="relative text-sm font-semibold uppercase tracking-[0.18em] text-blush">
        Convite privado
      </p>
      <h1 className="font-display relative mt-3 text-3xl leading-tight sm:text-4xl md:text-[2.75rem]">
        {event.name}
      </h1>

      <dl className="relative mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-blush/90">Data</dt>
          <dd className="mt-1 text-lg font-semibold">{event.dateLabel}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-blush/90">Horário</dt>
          <dd className="mt-1 text-lg font-semibold">
            {event.timeLabel}
            <span className="ml-2 text-sm font-normal text-blush/90">
              ({event.timezone.replace('_', ' ')})
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-blush/90">Local</dt>
          <dd className="mt-1 text-lg font-semibold">{event.venue}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-blush/90">Endereço</dt>
          <dd className="mt-1 text-base leading-snug">{event.address}</dd>
        </div>
      </dl>

      <p className="relative mt-6 inline-flex rounded-full bg-cream/15 px-4 py-2 text-sm font-semibold ring-1 ring-cream/25">
        {event.giftLimitLabel}
      </p>
    </header>
  )
}
