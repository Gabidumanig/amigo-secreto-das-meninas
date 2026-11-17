export type RegistrationStatus = 'open' | 'closed'
export type DrawStatus = 'pending' | 'done'

export interface EventInfo {
  id: string
  publicSlug: string
  name: string
  dateLabel: string
  timeLabel: string
  timezone: 'America/Sao_Paulo'
  venue: string
  address: string
  giftLimitLabel: string
  registrationStatus: RegistrationStatus
  drawStatus: DrawStatus
}

export interface FoodItem {
  participantId: string
  name: string
  food: string
}

export interface ParticipantFormValues {
  name: string
  email: string
  gift1: string
  gift2: string
  gift3: string
  food: string
}

export interface ConfirmedParticipation extends ParticipantFormValues {
  id: string
  createdAt: string
}
