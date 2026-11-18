import { useMemo, useState } from 'react'
import { ConfirmationCard } from '../components/ConfirmationCard'
import { EventHero } from '../components/EventHero'
import { RegistrationForm } from '../components/RegistrationForm'
import { DEMO_EVENT, DEMO_FOOD_LIST } from '../data/demo'
import type { ConfirmedParticipation, FoodItem } from '../types'

export function EventPage() {
  const [foodList, setFoodList] = useState<FoodItem[]>(DEMO_FOOD_LIST)
  const [confirmed, setConfirmed] = useState<ConfirmedParticipation | null>(null)

  const event = DEMO_EVENT

  const closedMessage = useMemo(
    () =>
      event.registrationStatus === 'closed'
        ? 'As inscrições para este amigo secreto já foram encerradas. O resultado do sorteio será enviado por e-mail às participantes.'
        : null,
    [event.registrationStatus],
  )

  function handleConfirm(participation: ConfirmedParticipation) {
    setFoodList((prev) => [
      ...prev,
      {
        participantId: participation.id,
        name: participation.name,
        food: participation.food,
      },
    ])
    setConfirmed(participation)
  }

  return (
    <div className="min-h-dvh">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <EventHero event={event} />

        {closedMessage ? (
          <section
            className="rounded-[1.5rem] border border-wine/10 bg-cream/90 p-6"
            aria-live="polite"
          >
            <h2 className="font-display text-2xl text-wine">Inscrições encerradas</h2>
            <p className="mt-2 text-muted">{closedMessage}</p>
          </section>
        ) : confirmed ? (
          <ConfirmationCard
            event={event}
            participation={confirmed}
            onRegisterAnother={() => setConfirmed(null)}
          />
        ) : (
          <RegistrationForm foodList={foodList} onConfirm={handleConfirm} />
        )}
      </main>
    </div>
  )
}
