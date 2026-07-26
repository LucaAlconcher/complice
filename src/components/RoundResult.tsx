import type { MatchState } from '../game/types'

export function RoundResult({
  match,
  humanId,
  onNextRound,
}: {
  match: MatchState
  humanId: string
  onNextRound: () => void
}) {
  const winners = match.round.winners
  const tie = winners.length > 1
  const humanWon = winners.includes(humanId)

  return (
    <div className="mx-auto max-w-md space-y-5 p-6 text-center">
      <h2 className="text-2xl font-bold text-white">
        {tie ? 'Ronda empatada' : humanWon ? 'Ganaste la ronda' : 'Gano la CPU esta ronda'}
      </h2>
      <div className="rounded-xl bg-slate-800 p-4 space-y-2">
        {match.participants.map((p) => (
          <div key={p.id} className="flex justify-between text-slate-300">
            <span>{p.name}</span>
            <span className="font-bold text-white">{p.roundWins} / {match.winTarget}</span>
          </div>
        ))}
      </div>
      <button
        data-testid="next-round"
        onClick={onNextRound}
        className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white"
      >
        Siguiente ronda
      </button>
    </div>
  )
}
