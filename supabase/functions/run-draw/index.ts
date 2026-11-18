import { assertValidDraw, drawPairs } from '../_shared/draw.ts'
import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { drawResultEmail, sendTransactionalEmail } from '../_shared/email.ts'
import { serviceClient, userClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return jsonResponse({ error: 'Método não permitido.' }, 405)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Não autorizado.' }, 401)

    const body = await req.json()
    const eventId = String(body.eventId ?? '')
    const confirmed = Boolean(body.confirmed)
    if (!eventId) return jsonResponse({ error: 'eventId obrigatório.' }, 400)
    if (!confirmed) {
      return jsonResponse({
        error: 'Confirme o sorteio.',
        confirmation:
          'Todas já se cadastraram? O sorteio será realizado uma única vez e cada participante receberá o resultado por e-mail.',
      }, 400)
    }

    const authClient = userClient(authHeader)
    const { data: userData, error: userError } = await authClient.auth.getUser()
    if (userError || !userData.user) return jsonResponse({ error: 'Não autorizado.' }, 401)

    const supabase = serviceClient()
    const { data: adminRow } = await supabase
      .from('event_admins')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (!adminRow) return jsonResponse({ error: 'Não autorizado.' }, 403)

    // Transactional-ish flow via single update guard + inserts
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, registration_status, draw_status, date_label, time_label, venue, address')
      .eq('id', eventId)
      .single()

    if (eventError) throw eventError
    if (event.draw_status === 'done') {
      return jsonResponse({ error: 'O sorteio já foi realizado.' }, 409)
    }
    if (event.registration_status !== 'closed') {
      return jsonResponse({ error: 'Encerre as inscrições antes do sorteio.' }, 409)
    }

    const { data: participants, error: partError } = await supabase
      .from('participants')
      .select('id, name, email, gift1, gift2, gift3, food')
      .eq('event_id', eventId)

    if (partError) throw partError
    if (!participants || participants.length < 3) {
      return jsonResponse({ error: 'É preciso ter pelo menos 3 participantes.' }, 409)
    }

    const ids = participants.map((p) => p.id)
    const pairs = drawPairs(ids)
    assertValidDraw(pairs, ids)

    // Claim draw atomically: only one concurrent caller succeeds
    const { data: claimed, error: claimError } = await supabase
      .from('events')
      .update({ draw_status: 'done', registration_status: 'closed' })
      .eq('id', eventId)
      .eq('draw_status', 'pending')
      .select('id')
      .maybeSingle()

    if (claimError) throw claimError
    if (!claimed) {
      return jsonResponse({ error: 'O sorteio já foi realizado.' }, 409)
    }

    const { error: pairsError } = await supabase.from('draw_pairs').insert(
      pairs.map((p) => ({
        event_id: eventId,
        giver_id: p.giverId,
        receiver_id: p.receiverId,
      })),
    )

    if (pairsError) {
      // Best-effort rollback of claim if inserts fail
      await supabase.from('events').update({ draw_status: 'pending' }).eq('id', eventId)
      throw pairsError
    }

    const byId = new Map(participants.map((p) => [p.id, p]))
    let queued = 0
    let simulated = 0
    let failed = 0

    for (const pair of pairs) {
      const giver = byId.get(pair.giverId)!
      const receiver = byId.get(pair.receiverId)!
      const mail = drawResultEmail({
        name: giver.name,
        receiverName: receiver.name,
        gift1: receiver.gift1,
        gift2: receiver.gift2,
        gift3: receiver.gift3,
        ownFood: giver.food,
        dateLabel: event.date_label,
        timeLabel: event.time_label,
        venue: event.venue,
        address: event.address,
      })
      const idempotencyKey = `draw_result:${eventId}:${giver.id}`

      await supabase.from('email_jobs').upsert(
        {
          event_id: eventId,
          participant_id: giver.id,
          job_type: 'draw_result',
          status: 'pending',
          idempotency_key: idempotencyKey,
          payload: {},
        },
        { onConflict: 'idempotency_key' },
      )

      const sent = await sendTransactionalEmail({
        to: giver.email,
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

      queued += 1
      if (sent.simulated) simulated += 1
      if (!sent.accepted) failed += 1
    }

    // Never return pairs to the client
    return jsonResponse({
      ok: true,
      participantCount: participants.length,
      emailsQueued: queued,
      emailsSimulated: simulated,
      emailsFailed: failed,
      message: 'Sorteio realizado. Os resultados foram enfileirados para envio por e-mail.',
    })
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', msg: 'run_draw_failed', err: String(error) }))
    return jsonResponse({ error: 'Não foi possível realizar o sorteio.' }, 500)
  }
})
