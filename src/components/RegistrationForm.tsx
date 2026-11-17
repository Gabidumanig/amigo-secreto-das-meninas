import { useMemo, useState, type FormEvent } from 'react'
import type { ConfirmedParticipation, FoodItem, ParticipantFormValues } from '../types'
import { foodsMatch } from '../lib/normalize'
import { validateParticipantForm, type FieldErrors } from '../lib/validation'
import { Field } from './Field'
import { FoodList } from './FoodList'

const EMPTY_FORM: ParticipantFormValues = {
  name: '',
  email: '',
  gift1: '',
  gift2: '',
  gift3: '',
  food: '',
}

interface RegistrationFormProps {
  foodList: FoodItem[]
  onConfirm: (participation: ConfirmedParticipation) => void
}

export function RegistrationForm({ foodList, onConfirm }: RegistrationFormProps) {
  const [values, setValues] = useState<ParticipantFormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const isDuplicateFood = useMemo(
    () => foodList.some((item) => foodsMatch(item.food, values.food)),
    [foodList, values.food],
  )

  function updateField<K extends keyof ParticipantFormValues>(key: K, value: ParticipantFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateParticipantForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    // Simulação local da Etapa 1 — sem chamada de API real
    await new Promise((resolve) => setTimeout(resolve, 450))

    onConfirm({
      ...values,
      name: values.name.trim(),
      email: values.email.trim(),
      gift1: values.gift1.trim(),
      gift2: values.gift2.trim(),
      gift3: values.gift3.trim(),
      food: values.food.trim(),
      id: `demo-local-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    })
    setSubmitting(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-[1.5rem] border border-wine/10 bg-cream/85 p-5 shadow-[0_18px_40px_-30px_rgba(58,31,40,0.45)] sm:p-7"
      aria-labelledby="registration-heading"
    >
      <div>
        <h2 id="registration-heading" className="font-display text-2xl text-wine">
          Confirme sua participação
        </h2>
        <p className="mt-1 text-sm text-muted">
          Nome, e-mail e comida são obrigatórios. As sugestões de presente são opcionais.
        </p>
      </div>

      <Field
        id="name"
        label="Nome"
        autoComplete="name"
        value={values.name}
        onChange={(e) => updateField('name', e.target.value)}
        error={errors.name}
        required
      />

      <Field
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={values.email}
        onChange={(e) => updateField('email', e.target.value)}
        error={errors.email}
        required
      />

      <fieldset className="space-y-4 rounded-2xl border border-wine/10 bg-blush/25 p-4 sm:p-5">
        <legend className="px-1 text-sm font-semibold text-wine">
          Dê três ideias de presentes que você gostaria de ganhar, respeitando o valor de até
          R$ 100,00.
        </legend>
        <Field
          id="gift1"
          label="Sugestão de presente 1"
          value={values.gift1}
          onChange={(e) => updateField('gift1', e.target.value)}
          error={errors.gift1}
        />
        <Field
          id="gift2"
          label="Sugestão de presente 2"
          value={values.gift2}
          onChange={(e) => updateField('gift2', e.target.value)}
          error={errors.gift2}
        />
        <Field
          id="gift3"
          label="Sugestão de presente 3"
          value={values.gift3}
          onChange={(e) => updateField('gift3', e.target.value)}
          error={errors.gift3}
        />
      </fieldset>

      <Field
        id="food"
        label="O que você vai levar de comida?"
        placeholder="Ex.: torta de chocolate…"
        value={values.food}
        onChange={(e) => updateField('food', e.target.value)}
        error={errors.food}
        required
      />

      <FoodList
        items={foodList}
        highlightedFood={values.food}
        isDuplicate={isDuplicateFood}
      />

      <button
        type="submit"
        disabled={submitting}
        className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-wine px-5 text-base font-semibold text-cream transition hover:bg-wine-deep disabled:cursor-wait disabled:opacity-70"
      >
        {submitting ? 'Confirmando…' : 'Confirmar minha participação'}
      </button>
    </form>
  )
}
