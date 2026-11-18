import { assertValidDraw, drawPairs } from './draw.mjs'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const ids = ['a', 'b', 'c', 'd', 'e']

let threw = false
try {
  drawPairs(['a', 'b'])
} catch {
  threw = true
}
assert(threw, 'deve bloquear menos de 3')

for (let i = 0; i < 200; i++) {
  const pairs = drawPairs(ids)
  assertValidDraw(pairs, ids)
  assert(pairs.every((p) => p.giverId !== p.receiverId), 'sem auto')
  assert(new Set(pairs.map((p) => p.giverId)).size === ids.length, 'givers únicos')
  assert(new Set(pairs.map((p) => p.receiverId)).size === ids.length, 'receivers únicos')
}

console.log('draw.test.mjs: OK')
