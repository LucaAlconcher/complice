import type { MatchState } from '../game/types'

export function Scoreboard({ match }: { match: MatchState }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-800 px-4 py-3">
      <span className="text-sm text-slate-400">Ronda {match.round.roundNumber} - primero a {match.winTarget}</span>
      <div className="flex gap-4">
        {match.participants.map((p) => (
          <div key={p.id} className="text-center">
            <div className="text-xs text-slate-400">{p.name}</div>
            <div className="text-lg font-bold text-white">{p.roundWins}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
