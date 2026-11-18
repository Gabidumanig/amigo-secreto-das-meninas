/** Sorteio seguro: derangement sem loop infinito. */

function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) throw new Error('maxExclusive must be > 0')
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % maxExclusive
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export type DrawPair = { giverId: string; receiverId: string }

/**
 * Cada pessoa tira exatamente uma outra; ninguém tira a si mesma.
 * Usa até 64 tentativas de Fisher–Yates; fallback cíclico garantido.
 */
export function drawPairs(participantIds: string[]): DrawPair[] {
  const ids = [...participantIds]
  if (ids.length < 3) {
    throw new Error('É preciso ter pelo menos 3 participantes para o sorteio.')
  }

  for (let attempt = 0; attempt < 64; attempt++) {
    const receivers = shuffle(ids)
    const ok = receivers.every((receiverId, index) => receiverId !== ids[index])
    if (ok) {
      return ids.map((giverId, index) => ({
        giverId,
        receiverId: receivers[index],
      }))
    }
  }

  const n = ids.length
  const k = 1 + randomInt(n - 1)
  return ids.map((giverId, index) => ({
    giverId,
    receiverId: ids[(index + k) % n],
  }))
}

export function assertValidDraw(pairs: DrawPair[], participantIds: string[]): void {
  if (pairs.length !== participantIds.length) {
    throw new Error('Quantidade de pares diferente do total de participantes.')
  }
  const givers = new Set(pairs.map((p) => p.giverId))
  const receivers = new Set(pairs.map((p) => p.receiverId))
  for (const id of participantIds) {
    if (!givers.has(id)) throw new Error('Participante de fora do sorteio (giver).')
    if (!receivers.has(id)) throw new Error('Participante de fora do sorteio (receiver).')
  }
  for (const pair of pairs) {
    if (pair.giverId === pair.receiverId) throw new Error('Auto-sorteio detectado.')
    if (!participantIds.includes(pair.giverId) || !participantIds.includes(pair.receiverId)) {
      throw new Error('Par com participante inválida.')
    }
  }
}
