import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { confirmationEmail, sendTransactionalEmail } from '../_shared/email.ts'
import { randomToken, serviceClient, sha256Hex } from '../_shared/supabase.ts'
import { sanitizeParticipantInput, validateParticipantInput } from '../_shared/validate.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return jsonResponse({ error: 'Método não permitido.' }, 405)

  try {
    const body = await req.json()
    const slug = String(body.eventSlug ?? '')
    const input = {
      name: String(body.name ?? ''),
      email: String(body.email ?? ''),
      gift1: String(body.gift1 ?? ''),
      gift2: String(body.gift2 ?? ''),
      gift3: String(body.gift3 ?? ''),
      food: String(body.food ?? ''),
    }

    const errors = validateParticipantInput(input)
    if (Object.keys(errors).length > 0) {
      return jsonResponse({ error: 'Dados inválidos.', errors }, 400)
    }

    const data = sanitizeParticipantInput(input)
    const supabase = serviceClient()

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, date_label, time_label, venue, address, registration_status, draw_status, public_slug')
      .eq('public_slug', slug)
      .maybeSingle()

    if (eventError) throw eventError
    if (!event) return jsonResponse({ error: 'Evento não encontrado.' }, 404)
    if (event.registration_status !== 'open') {
      return jsonResponse({ error: 'As inscrições estão encerradas.' }, 409)
    }
    if (event.draw_status === 'done') {
      return jsonResponse({ error: 'O sorteio já foi realizado.' }, 409)
    }

    const { data: participant, error: insertError } = await supabase
      .from('participants')
      .insert({
        event_id: event.id,
        ...data,
      })
      .select('id, name, email, gift1, gift2, gift3, food, created_at')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return jsonResponse({ error: 'Este e-mail já está cadastrado neste evento.' }, 409)
      }
      throw insertError
    }

    const rawToken = randomToken(32)
    const tokenHash = await sha256Hex(rawToken)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()

    await supabase.from('edit_tokens').insert({
      participant_id: participant.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })

    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') ?? 'http://127.0.0.1:8765'
    const editUrl = `${siteUrl.replace(/\/$/, '')}/editar.html?token=${rawToken}`

    const mail = confirmationEmail({
      name: participant.name,
      editUrl,
      eventName: event.name,
      dateLabel: event.date_label,
      timeLabel: event.time_label,
      venue: event.venue,
      address: event.address,
    })

    const idempotencyKey = `confirmation:${participant.id}`
    await supabase.from('email_jobs').upsert(
      {
        event_id: event.id,
        participant_id: participant.id,
        job_type: 'confirmation',
        status: 'pending',
        idempotency_key: idempotencyKey,
        payload: { editUrl },
      },
      { onConflict: 'idempotency_key' },
    )

    const sent = await sendTransactionalEmail({
      to: participant.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      idempotencyKey,
    })

    await supabase
      .from('email_jobs')
      .update({
        status: sent.accepted ? 'accepted' : 'failed',
        provider_message_id: sent.providerMessageId,
        attempts: 1,
        last_error: sent.error ?? (sent.simulated ? 'simulated' : null),
      })
      .eq('idempotency_key', idempotencyKey)

    return jsonResponse({
      ok: true,
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        gift1: participant.gift1,
        gift2: participant.gift2,
        gift3: participant.gift3,
        food: participant.food,
      },
      emailSimulated: sent.simulated,
      message:
        'Prontinho! Sua participação está confirmada. Assim que o sorteio acontecer, você receberá por e-mail quem tirou e as sugestões de presente dela.',
    })
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', msg: 'register_failed', err: String(error) }))
    return jsonResponse({ error: 'Não foi possível confirmar a participação.' }, 500)
  }
})
