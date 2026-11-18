import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { serviceClient, sha256Hex } from '../_shared/supabase.ts'
import { sanitizeParticipantInput, validateParticipantInput } from '../_shared/validate.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()

  try {
    const supabase = serviceClient()
    const token = req.headers.get('x-edit-token') ?? ''
    if (!token) return jsonResponse({ error: 'Token ausente.' }, 401)
    const tokenHash = await sha256Hex(token)

    const { data: tokenRow } = await supabase
      .from('edit_tokens')
      .select('id, participant_id, expires_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (!tokenRow) return jsonResponse({ error: 'Link inválido ou expirado.' }, 401)
    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      return jsonResponse({ error: 'Link expirado.' }, 401)
    }

    const { data: participant } = await supabase
      .from('participants')
      .select('id, event_id, name, email, gift1, gift2, gift3, food')
      .eq('id', tokenRow.participant_id)
      .single()

    if (!participant) return jsonResponse({ error: 'Participante não encontrada.' }, 404)

    const { data: event } = await supabase
      .from('events')
      .select('id, registration_status, draw_status, name, date_label, time_label, venue, address, gift_limit_label, public_slug')
      .eq('id', participant.event_id)
      .single()

    if (!event) return jsonResponse({ error: 'Evento não encontrado.' }, 404)

    if (req.method === 'GET') {
      return jsonResponse({
        event: {
          name: event.name,
          dateLabel: event.date_label,
          timeLabel: event.time_label,
          venue: event.venue,
          address: event.address,
          giftLimitLabel: event.gift_limit_label,
          registrationStatus: event.registration_status,
          drawStatus: event.draw_status,
        },
        participant: {
          name: participant.name,
          email: participant.email,
          gift1: participant.gift1,
          gift2: participant.gift2,
          gift3: participant.gift3,
          food: participant.food,
        },
        permissions: editPermissions(event.registration_status, event.draw_status),
      })
    }

    if (req.method !== 'PATCH') return jsonResponse({ error: 'Método não permitido.' }, 405)

    const body = await req.json()
    const perms = editPermissions(event.registration_status, event.draw_status)

    const next = {
      name: perms.canEditProfile ? String(body.name ?? participant.name) : participant.name,
      email: perms.canEditProfile ? String(body.email ?? participant.email) : participant.email,
      gift1: perms.canEditGifts ? String(body.gift1 ?? participant.gift1) : participant.gift1,
      gift2: perms.canEditGifts ? String(body.gift2 ?? participant.gift2) : participant.gift2,
      gift3: perms.canEditGifts ? String(body.gift3 ?? participant.gift3) : participant.gift3,
      food: perms.canEditFood ? String(body.food ?? participant.food) : participant.food,
    }

    const errors = validateParticipantInput(next)
    if (Object.keys(errors).length > 0) {
      return jsonResponse({ error: 'Dados inválidos.', errors }, 400)
    }

    const sanitized = sanitizeParticipantInput(next)
    const emailChanging =
      sanitized.email_normalized !== participant.email.trim().toLowerCase()

    if (emailChanging) {
      return jsonResponse({
        error:
          'Para trocar o e-mail, solicite um novo link no e-mail atual. A transferência com verificação será habilitada na próxima melhoria.',
      }, 400)
    }

    const { data: updated, error } = await supabase
      .from('participants')
      .update({
        name: sanitized.name,
        gift1: sanitized.gift1,
        gift2: sanitized.gift2,
        gift3: sanitized.gift3,
        food: sanitized.food,
      })
      .eq('id', participant.id)
      .select('id, name, email, gift1, gift2, gift3, food')
      .single()

    if (error) throw error

    return jsonResponse({ ok: true, participant: updated })
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', msg: 'edit_participant_failed', err: String(error) }))
    return jsonResponse({ error: 'Não foi possível atualizar.' }, 500)
  }
})

function editPermissions(registrationStatus: string, drawStatus: string) {
  if (drawStatus === 'done') {
    return { canEditProfile: false, canEditGifts: false, canEditFood: true }
  }
  if (registrationStatus === 'closed') {
    return { canEditProfile: false, canEditGifts: false, canEditFood: true }
  }
  return { canEditProfile: true, canEditGifts: true, canEditFood: true }
}
