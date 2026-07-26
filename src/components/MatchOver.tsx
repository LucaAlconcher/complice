import type { MatchState } from '../game/types'

export function MatchOver({
  match,
  humanId,
  onRestart,
}: {
  match: MatchState
  humanId: string
  onRestart: () => void
}) {
  const humanWon = match.matchWinnerId === humanId

  return (
    <div className="mx-auto max-w-md space-y-5 p-6 text-center">
      <h2 className="text-3xl font-bold text-white">
        {humanWon ? 'Ganaste la partida!' : 'Gano la Maquina'}
      </h2>
      <p className="text-slate-400">Primero a {match.winTarget} rondas ganadas.</p>
      <button
        onClick={onRestart}
        className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white"
      >
        Jugar de nuevo
      </button>
    </div>
  )
}
