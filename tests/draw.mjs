function randomInt(maxExclusive) {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % maxExclusive
}

function shuffle(items) {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function drawPairs(participantIds) {
  const ids = [...participantIds]
  if (ids.length < 3) throw new Error('É preciso ter pelo menos 3 participantes para o sorteio.')

  for (let attempt = 0; attempt < 64; attempt++) {
    const receivers = shuffle(ids)
    if (receivers.every((receiverId, index) => receiverId !== ids[index])) {
      return ids.map((giverId, index) => ({ giverId, receiverId: receivers[index] }))
    }
  }

  const n = ids.length
  const k = 1 + randomInt(n - 1)
  return ids.map((giverId, index) => ({
    giverId,
    receiverId: ids[(index + k) % n],
  }))
}

export function assertValidDraw(pairs, participantIds) {
  if (pairs.length !== participantIds.length) throw new Error('size')
  const givers = new Set(pairs.map((p) => p.giverId))
  const receivers = new Set(pairs.map((p) => p.receiverId))
  for (const id of participantIds) {
    if (!givers.has(id) || !receivers.has(id)) throw new Error('coverage')
  }
  for (const pair of pairs) {
    if (pair.giverId === pair.receiverId) throw new Error('self')
  }
}
