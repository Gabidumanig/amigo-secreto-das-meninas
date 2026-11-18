export type SendEmailInput = {
  to: string
  subject: string
  html: string
  text: string
  idempotencyKey: string
}

export type SendEmailResult = {
  simulated: boolean
  providerMessageId: string | null
  accepted: boolean
  error?: string
}

export async function sendTransactionalEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('EMAIL_FROM') ?? 'Amigo Secreto <onboarding@resend.dev>'
  const simulate = Deno.env.get('EMAIL_SIMULATE') === 'true' || !apiKey

  if (simulate) {
    console.log(
      JSON.stringify({
        level: 'info',
        msg: 'email_simulated',
        toDomain: input.to.split('@')[1] ?? null,
        subject: input.subject,
        idempotencyKey: input.idempotencyKey,
      }),
    )
    return {
      simulated: true,
      providerMessageId: `sim_${input.idempotencyKey}`,
      accepted: true,
    }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': input.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    return {
      simulated: false,
      providerMessageId: null,
      accepted: false,
      error: `Resend ${res.status}: ${body.slice(0, 300)}`,
    }
  }

  const data = await res.json()
  return {
    simulated: false,
    providerMessageId: data.id ?? null,
    accepted: true,
  }
}

export function confirmationEmail(params: {
  name: string
  editUrl: string
  eventName: string
  dateLabel: string
  timeLabel: string
  venue: string
  address: string
}) {
  const subject = 'Participação confirmada — Amigo Secreto das Meninas'
  const text = `Oi, ${params.name}!

Sua participação no ${params.eventName} está confirmada.

Para editar seus dados, use este link (pessoal e com validade):
${params.editUrl}

Encontro: ${params.dateLabel}, ${params.timeLabel}
${params.venue}
${params.address}

Até lá!`
  const html = `<p>Oi, ${escapeHtml(params.name)}!</p>
<p>Sua participação no <strong>${escapeHtml(params.eventName)}</strong> está confirmada.</p>
<p><a href="${escapeAttr(params.editUrl)}">Editar meus dados</a></p>
<p>Encontro: ${escapeHtml(params.dateLabel)}, ${escapeHtml(params.timeLabel)}<br>
${escapeHtml(params.venue)}<br>
${escapeHtml(params.address)}</p>`
  return { subject, text, html }
}

export function drawResultEmail(params: {
  name: string
  receiverName: string
  gift1: string
  gift2: string
  gift3: string
  ownFood: string
  dateLabel: string
  timeLabel: string
  venue: string
  address: string
}) {
  const subject = 'Seu amigo secreto foi sorteado!'
  const gifts = [
    params.gift1 || '(sem sugestão)',
    params.gift2 || '(sem sugestão)',
    params.gift3 || '(sem sugestão)',
  ]
  const text = `Oi, ${params.name}!

O nosso amigo secreto já foi sorteado!

Você tirou: ${params.receiverName}

Aqui estão as três sugestões de presente dela:
1. ${gifts[0]}
2. ${gifts[1]}
3. ${gifts[2]}

Lembrete: o presente deve custar até R$ 100,00.

Nosso encontro:
Data: ${params.dateLabel}
Horário: ${params.timeLabel}
Local: ${params.venue}
Endereço: ${params.address}

Você informou que vai levar: ${params.ownFood}

Guarde o segredo e até lá!`

  const html = `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#3a1f28;max-width:560px;margin:0 auto;padding:16px">
<p>Oi, ${escapeHtml(params.name)}!</p>
<p>O nosso amigo secreto já foi sorteado!</p>
<p><strong>Você tirou: ${escapeHtml(params.receiverName)}</strong></p>
<p>Aqui estão as três sugestões de presente dela:</p>
<ol>
<li>${escapeHtml(gifts[0])}</li>
<li>${escapeHtml(gifts[1])}</li>
<li>${escapeHtml(gifts[2])}</li>
</ol>
<p>Lembrete: o presente deve custar até R$ 100,00.</p>
<p><strong>Nosso encontro:</strong><br>
Data: ${escapeHtml(params.dateLabel)}<br>
Horário: ${escapeHtml(params.timeLabel)}<br>
Local: ${escapeHtml(params.venue)}<br>
Endereço: ${escapeHtml(params.address)}</p>
<p>Você informou que vai levar: ${escapeHtml(params.ownFood)}</p>
<p>Guarde o segredo e até lá!</p>
</div>`

  return { subject, text, html }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", '&#39;')
}
