import { useEffect, useRef } from 'react'
import type { ConfirmedParticipation, EventInfo } from '../types'

interface ConfirmationCardProps {
  event: EventInfo
  participation: ConfirmedParticipation
  onRegisterAnother: () => void
}

export function ConfirmationCard({
  event,
  participation,
  onRegisterAnother,
}: ConfirmationCardProps) {
  const cardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    cardRef.current?.focus()
  }, [])

  return (
    <section
      ref={cardRef}
      className="rounded-[1.5rem] border border-success/20 bg-cream/90 p-6 shadow-[0_18px_40px_-30px_rgba(58,31,40,0.45)] sm:p-8"
      aria-labelledby="confirmation-heading"
      tabIndex={-1}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-success">
        Participação confirmada
      </p>
      <h2 id="confirmation-heading" className="font-display mt-2 text-2xl text-wine sm:text-3xl">
        Prontinho! Sua participação está confirmada.
      </h2>
      <p className="mt-3 text-base leading-relaxed text-muted">
        Assim que o sorteio acontecer, você receberá por e-mail quem tirou e as sugestões de
        presente dela.
      </p>

      <dl className="mt-6 space-y-3 rounded-2xl bg-blush/30 p-4 text-sm sm:p-5">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
          <dt className="font-semibold text-ink">Nome</dt>
          <dd>{participation.name}</dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
          <dt className="font-semibold text-ink">E-mail</dt>
          <dd className="break-all">{participation.email}</dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
          <dt className="font-semibold text-ink">Sugestão 1</dt>
          <dd>{participation.gift1}</dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
          <dt className="font-semibold text-ink">Sugestão 2</dt>
          <dd>{participation.gift2}</dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
          <dt className="font-semibold text-ink">Sugestão 3</dt>
          <dd>{participation.gift3}</dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
          <dt className="font-semibold text-ink">Comida</dt>
          <dd>{participation.food}</dd>
        </div>
      </dl>

      <p className="mt-5 text-sm text-muted">
        {event.name} · {event.dateLabel} · {event.timeLabel} · {event.venue}
      </p>

      <button
        type="button"
        onClick={onRegisterAnother}
        className="mt-6 min-h-12 w-full rounded-2xl border border-wine/20 bg-cream px-4 text-sm font-semibold text-wine transition hover:bg-blush/40"
      >
        Voltar ao formulário (demo)
      </button>
    </section>
  )
}
