import { normalizeEmail } from './normalize.ts'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ParticipantInput = {
  name: string
  email: string
  gift1?: string
  gift2?: string
  gift3?: string
  food: string
}

export type FieldErrors = Partial<Record<keyof ParticipantInput, string>>

export function validateParticipantInput(values: ParticipantInput): FieldErrors {
  const errors: FieldErrors = {}

  if (!values.name?.trim()) errors.name = 'Informe seu nome.'

  const email = values.email?.trim() ?? ''
  if (!email) errors.email = 'Informe seu e-mail.'
  else if (!EMAIL_RE.test(email)) errors.email = 'Informe um e-mail válido.'

  if (!values.food?.trim()) errors.food = 'Informe o que você vai levar de comida.'

  return errors
}

export function sanitizeParticipantInput(values: ParticipantInput) {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    email_normalized: normalizeEmail(values.email),
    gift1: (values.gift1 ?? '').trim(),
    gift2: (values.gift2 ?? '').trim(),
    gift3: (values.gift3 ?? '').trim(),
    food: values.food.trim(),
  }
}
