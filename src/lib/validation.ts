import type { ParticipantFormValues } from '../types'

export type FieldErrors = Partial<Record<keyof ParticipantFormValues, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function validateParticipantForm(values: ParticipantFormValues): FieldErrors {
  const errors: FieldErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Informe seu nome.'
  }

  const email = values.email.trim()
  if (!email) {
    errors.email = 'Informe seu e-mail.'
  } else if (!EMAIL_RE.test(email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (!values.food.trim()) {
    errors.food = 'Informe o que você vai levar de comida.'
  }

  return errors
}
