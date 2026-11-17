/** Normaliza texto para comparação de comidas (sem acento, case e espaços extras). */
export function normalizeFoodText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export function foodsMatch(a: string, b: string): boolean {
  const left = normalizeFoodText(a)
  const right = normalizeFoodText(b)
  if (!left || !right) return false
  return left === right
}
