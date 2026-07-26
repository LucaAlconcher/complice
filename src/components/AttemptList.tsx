import type { Participant } from '../game/types'
import { FeedbackPill } from './FeedbackPill'

export function AttemptList({ title, participant }: { title: string; participant: Participant }) {
  return (
    <div className="rounded-xl bg-slate-800 p-4 flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-slate-300 mb-2">{title}</h3>
      {participant.attempts.length === 0 ? (
        <p className="text-xs text-slate-500">Todavia sin intentos.</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {[...participant.attempts].reverse().map((a) => (
            <li key={a.turnNumber} className="flex items-center justify-between gap-3">
              <span className="font-mono text-lg tracking-widest text-white">{a.guess}</span>
              <FeedbackPill feedback={a.feedback} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
