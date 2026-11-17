import { IS_DEMO_MODE } from '../data/demo'

export function DemoBanner() {
  if (!IS_DEMO_MODE) return null

  return (
    <div
      role="status"
      className="border-b border-wine/15 bg-wine text-center text-sm font-medium text-cream px-4 py-2"
    >
      Modo demonstrativo — dados fictícios. Cadastro, banco e e-mails ainda não estão conectados.
    </div>
  )
}
