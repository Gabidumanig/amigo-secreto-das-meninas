import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { drawResultEmail, sendTransactionalEmail } from '../_shared/email.ts'
import { serviceClient, userClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return jsonResponse({ error: 'Método não permitido.' }, 405)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Não autorizado.' }, 401)

    const authClient = userClient(authHeader)
    const { data: userData } = await authClient.auth.getUser()
    if (!userData.user) return jsonResponse({ error: 'Não autorizado.' }, 401)

    const body = await req.json()
    const action = String(body.action ?? '')
    const eventId = String(body.eventId ?? '')
    if (!eventId) return jsonResponse({ error: 'eventId obrigatório.' }, 400)

    const supabase = serviceClient()
    const { data: adminRow } = await supabase
      .from('event_admins')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (!adminRow) return jsonResponse({ error: 'Não autorizado.' }, 403)

    if (action === 'dashboard') {
      const [{ data: event }, { data: participants }, { data: jobs }] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).single(),
        supabase
          .from('participants')
          .select('id, name, email, food, created_at, updated_at')
          .eq('event_id', eventId)
          .order('created_at', { ascending: true }),
        supabase
          .from('email_jobs')
          .select('id, job_type, status, attempts, last_error, participant_id, created_at, updated_at')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false }),
      ])

      return jsonResponse({
        event,
        participants: participants ?? [],
        emailJobs: jobs ?? [],
        totals: {
          participants: participants?.length ?? 0,
          emailsPending: (jobs ?? []).filter((j) => j.status === 'pending' || j.status === 'failed').length,
          emailsAccepted: (jobs ?? []).filter((j) => j.status === 'accepted' || j.status === 'delivered').length,
        },
      })
    }

    if (action === 'close_registrations') {
      const { error } = await supabase
        .from('events')
        .update({ registration_status: 'closed' })
        .eq('id', eventId)
        .eq('draw_status', 'pending')
      if (error) throw error
      return jsonResponse({ ok: true })
    }

    if (action === 'reopen_registrations') {
      const { data: event } = await supabase
        .from('events')
        .select('draw_status')
        .eq('id', eventId)
        .single()
      if (event?.draw_status === 'done') {
        return jsonResponse({ error: 'Não é possível reabrir após o sorteio.' }, 409)
      }
      const { error } = await supabase
        .from('events')
        .update({ registration_status: 'open' })
        .eq('id', eventId)
      if (error) throw error
      return jsonResponse({ ok: true })
    }

    if (action === 'delete_participant') {
      const participantId = String(body.participantId ?? '')
      const { data: event } = await supabase
        .from('events')
        .select('draw_status')
        .eq('id', eventId)
        .single()
      if (event?.draw_status === 'done') {
        return jsonResponse({ error: 'Não é possível remover após o sorteio.' }, 409)
      }
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId)
        .eq('event_id', eventId)
      if (error) throw error
      return jsonResponse({ ok: true })
    }

    if (action === 'resend_failed_emails') {
      const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      if (!event || event.draw_status !== 'done') {
        return jsonResponse({ error: 'Sorteio ainda não realizado.' }, 409)
      }

      const { data: failed } = await supabase
        .from('email_jobs')
        .select('*')
        .eq('event_id', eventId)
        .eq('job_type', 'draw_result')
        .eq('status', 'failed')

      let resent = 0
      let simulated = 0

      for (const job of failed ?? []) {
        if (!job.participant_id) continue

        const { data: pair } = await supabase
          .from('draw_pairs')
          .select('giver_id, receiver_id')
          .eq('event_id', eventId)
          .eq('giver_id', job.participant_id)
          .maybeSingle()

        if (!pair) continue

        const { data: giver } = await supabase
          .from('participants')
          .select('*')
          .eq('id', pair.giver_id)
          .single()
        const { data: receiver } = await supabase
          .from('participants')
          .select('*')
          .eq('id', pair.receiver_id)
          .single()

        if (!giver || !receiver) continue

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

        const sent = await sendTransactionalEmail({
          to: giver.email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          idempotencyKey: `${job.idempotency_key}:retry:${job.attempts + 1}`,
        })

        await supabase
          .from('email_jobs')
          .update({
            status: sent.accepted ? 'accepted' : 'failed',
            provider_message_id: sent.providerMessageId,
            attempts: job.attempts + 1,
            last_error: sent.error ?? (sent.simulated ? 'simulated' : null),
          })
          .eq('id', job.id)

        resent += 1
        if (sent.simulated) simulated += 1
      }

      return jsonResponse({ ok: true, resent, simulated })
    }

    return jsonResponse({ error: 'Ação desconhecida.' }, 400)
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', msg: 'admin_api_failed', err: String(error) }))
    return jsonResponse({ error: 'Falha na operação administrativa.' }, 500)
  }
})
