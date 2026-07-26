import { useState } from 'react'
import type { PendingAttempt } from '../game/types'

export function GradingPanel({
  pending,
  guesserName,
  mySecret,
  onGrade,
}: {
  pending: PendingAttempt
  guesserName: string
  mySecret: string
  onGrade: (exact: number, misplaced: number) => void
}) {
  const [exact, setExact] = useState(0)
  const [misplaced, setMisplaced] = useState(0)
  const valid = exact + misplaced <= 4

  return (
    <div className="rounded-xl bg-indigo-500/10 border border-indigo-500 p-4 space-y-3" data-testid="grading-panel">
      <p className="text-sm text-indigo-300">
        {guesserName} intento: <span className="font-mono text-xl tracking-widest text-white">{pending.guess}</span>
      </p>
      <p className="text-xs text-slate-400" data-testid="grading-my-secret">
        Tu secreto: <span className="font-mono text-lg tracking-widest text-emerald-400">{mySecret}</span>
      </p>
      <p className="text-xs text-slate-400">Compara con tu secreto y califica el intento.</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-400 space-y-1">
          <span className="block">En posicion correcta</span>
          <input
            type="number"
            min={0}
            max={4}
            data-testid="grade-exact"
            value={exact}
            onChange={(e) => setExact(Math.max(0, Math.min(4, Number(e.target.value))))}
            className="w-full rounded-lg bg-slate-900 text-center text-2xl font-mono text-white py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="text-xs text-slate-400 space-y-1">
          <span className="block">Mal ubicados</span>
          <input
            type="number"
            min={0}
            max={4}
            data-testid="grade-misplaced"
            value={misplaced}
            onChange={(e) => setMisplaced(Math.max(0, Math.min(4, Number(e.target.value))))}
            className="w-full rounded-lg bg-slate-900 text-center text-2xl font-mono text-white py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
      </div>
      <button
        data-testid="grade-submit"
        disabled={!valid}
        onClick={() => onGrade(exact, misplaced)}
        className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white disabled:bg-slate-700 disabled:text-slate-500"
      >
        Confirmar calificacion
      </button>
    </div>
  )
}
