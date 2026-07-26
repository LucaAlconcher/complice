import type { Feedback } from '../game/types'

export function FeedbackPill({ feedback }: { feedback: Feedback }) {
  return (
    <div className="flex gap-2 text-xs font-semibold">
      <span className="rounded-full bg-emerald-600/20 text-emerald-400 px-2 py-1">
        {feedback.exact} en posicion correcta
      </span>
      <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-1">
        {feedback.misplaced} mal ubicado{feedback.misplaced === 1 ? '' : 's'}
      </span>
    </div>
  )
}
