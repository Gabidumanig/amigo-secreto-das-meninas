/**
 * DADOS DEMONSTRATIVOS — Etapa 1 (somente interface).
 * Serão substituídos pela integração real com Supabase na Etapa 2.
 * Não representam cadastros reais nem envios de e-mail.
 */
import type { EventInfo, FoodItem } from '../types'

export const IS_DEMO_MODE = true

export const DEMO_EVENT: EventInfo = {
  id: 'demo-event-id',
  // Identificador longo e não previsível (formato esperado no link privado)
  publicSlug: 'evt_a7f3c91e2b84d0569e1a4c8f27b0d3e5',
  name: 'Amigo Secreto das Meninas',
  dateLabel: '17 de dezembro de 2026',
  timeLabel: '18h',
  timezone: 'America/Sao_Paulo',
  venue: 'Casa da Gabi',
  address: 'Av. Açôce, 92, apartamento 152 — Moema',
  giftLimitLabel: 'Presente de até R$ 100,00',
  registrationStatus: 'open',
  drawStatus: 'pending',
}

export const DEMO_FOOD_LIST: FoodItem[] = []
