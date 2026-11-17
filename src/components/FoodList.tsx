import type { FoodItem } from '../types'

interface FoodListProps {
  items: FoodItem[]
  highlightedFood?: string
  isDuplicate?: boolean
}

export function FoodList({ items, highlightedFood, isDuplicate }: FoodListProps) {
  return (
    <section
      aria-labelledby="food-list-heading"
      className="rounded-2xl border border-wine/10 bg-cream/70 p-4 sm:p-5"
    >
      <h2 id="food-list-heading" className="font-display text-xl text-wine">
        O que cada uma vai levar
      </h2>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Ninguém informou ainda. Seja a primeira!
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-wine/10">
          {items.map((item) => (
            <li
              key={item.participantId}
              className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <span className="font-semibold text-ink">{item.name}</span>
              <span className="text-muted">{item.food}</span>
            </li>
          ))}
        </ul>
      )}

      {isDuplicate && highlightedFood?.trim() ? (
        <p
          role="status"
          className="mt-4 rounded-xl bg-warning/10 px-3 py-3 text-sm text-warning"
        >
          Uma das meninas já vai levar esse item. Que tal escolher outra opção?
        </p>
      ) : null}
    </section>
  )
}
