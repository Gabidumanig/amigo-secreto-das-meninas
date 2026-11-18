function cfg() {
  return window.AMIGO_CONFIG || {}
}

function assertConfig() {
  const c = cfg()
  if (!c.supabaseUrl || !c.supabaseAnonKey) {
    throw new Error(
      'Configure js/config.js com supabaseUrl e supabaseAnonKey do seu projeto Supabase.',
    )
  }
  return c
}

function functionsUrl(path) {
  const c = assertConfig()
  const base = (c.functionsBaseUrl || `${c.supabaseUrl.replace(/\/$/, '')}/functions/v1`).replace(
    /\/$/,
    '',
  )
  return `${base}/${path.replace(/^\//, '')}`
}

export async function fetchPublicEvent(slug) {
  const c = assertConfig()
  const res = await fetch(`${c.supabaseUrl}/rest/v1/rpc/get_public_event`, {
    method: 'POST',
    headers: {
      apikey: c.supabaseAnonKey,
      Authorization: `Bearer ${c.supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_slug: slug }),
  })
  if (!res.ok) throw new Error('Não foi possível carregar o evento.')
  const rows = await res.json()
  return rows?.[0] ?? null
}

export async function fetchPublicFoods(slug) {
  const c = assertConfig()
  const res = await fetch(`${c.supabaseUrl}/rest/v1/rpc/get_public_foods`, {
    method: 'POST',
    headers: {
      apikey: c.supabaseAnonKey,
      Authorization: `Bearer ${c.supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_slug: slug }),
  })
  if (!res.ok) throw new Error('Não foi possível carregar as comidas.')
  return await res.json()
}

export async function registerParticipant(payload) {
  const c = assertConfig()
  const res = await fetch(functionsUrl('register'), {
    method: 'POST',
    headers: {
      apikey: c.supabaseAnonKey,
      Authorization: `Bearer ${c.supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Falha no cadastro.')
    err.details = data
    throw err
  }
  return data
}

export async function requestEditLink(eventSlug, email) {
  const c = assertConfig()
  const res = await fetch(functionsUrl('request-edit-link'), {
    method: 'POST',
    headers: {
      apikey: c.supabaseAnonKey,
      Authorization: `Bearer ${c.supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ eventSlug, email }),
  })
  return res.json()
}

export async function loadEditParticipant(token) {
  const c = assertConfig()
  const res = await fetch(functionsUrl('edit-participant'), {
    method: 'GET',
    headers: {
      apikey: c.supabaseAnonKey,
      Authorization: `Bearer ${c.supabaseAnonKey}`,
      'x-edit-token': token,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Link inválido.')
  return data
}

export async function saveEditParticipant(token, payload) {
  const c = assertConfig()
  const res = await fetch(functionsUrl('edit-participant'), {
    method: 'PATCH',
    headers: {
      apikey: c.supabaseAnonKey,
      Authorization: `Bearer ${c.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'x-edit-token': token,
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Falha ao salvar.')
  return data
}

export async function adminApi(accessToken, body) {
  const c = assertConfig()
  const res = await fetch(functionsUrl('admin-api'), {
    method: 'POST',
    headers: {
      apikey: c.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Falha administrativa.')
  return data
}

export async function runDraw(accessToken, eventId) {
  const c = assertConfig()
  const res = await fetch(functionsUrl('run-draw'), {
    method: 'POST',
    headers: {
      apikey: c.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ eventId, confirmed: true }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Falha no sorteio.')
  return data
}

export { assertConfig, cfg }
