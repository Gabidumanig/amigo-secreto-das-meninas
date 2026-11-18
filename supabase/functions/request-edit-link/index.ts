import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { confirmationEmail, sendTransactionalEmail } from '../_shared/email.ts'
import { normalizeEmail } from '../_shared/normalize.ts'
import { randomToken, serviceClient, sha256Hex } from '../_shared/supabase.ts'

/**
 * Sempre responde sucesso genérico para não revelar se o e-mail existe.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return jsonResponse({ error: 'Método não permitido.' }, 405)

  const generic = {
    ok: true,
    message:
      'Se este e-mail estiver cadastrado, enviamos um novo link de edição. Verifique sua caixa de entrada.',
  }

  try {
    const body = await req.json()
    const slug = String(body.eventSlug ?? '')
    const emailNorm = normalizeEmail(String(body.email ?? ''))
    if (!slug || !emailNorm) return jsonResponse(generic)

    const supabase = serviceClient()
    const { data: event } = await supabase
      .from('events')
      .select('id, name, date_label, time_label, venue, address')
      .eq('public_slug', slug)
      .maybeSingle()

    if (!event) return jsonResponse(generic)

    const { data: participant } = await supabase
      .from('participants')
      .select('id, name, email')
      .eq('event_id', event.id)
      .eq('email_normalized', emailNorm)
      .maybeSingle()

    if (!participant) return jsonResponse(generic)

    const rawToken = randomToken(32)
    const tokenHash = await sha256Hex(rawToken)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()

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

    const idempotencyKey = `edit_link:${participant.id}:${tokenHash.slice(0, 12)}`
    await supabase.from('email_jobs').insert({
      event_id: event.id,
      participant_id: participant.id,
      job_type: 'edit_link',
      status: 'pending',
      idempotency_key: idempotencyKey,
      payload: {},
    })

    const sent = await sendTransactionalEmail({
      to: participant.email,
      subject: 'Seu link para editar a participação',
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

    return jsonResponse(generic)
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', msg: 'request_edit_link_failed', err: String(error) }))
    return jsonResponse(generic)
  }
})
