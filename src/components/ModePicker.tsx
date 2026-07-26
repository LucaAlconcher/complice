import { useState } from 'react'
import type { GameMode } from '../game/types'

export function ModePicker({ onStart, onBack }: { onStart: (mode: GameMode) => void; onBack: () => void }) {
  const [mode, setMode] = useState<GameMode>('word')

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <button data-testid="back-home" onClick={onBack} className="text-sm text-slate-400 hover:text-slate-200">
        &larr; Volver
      </button>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Contra la Maquina</h1>
      </div>

      <div className="rounded-xl bg-slate-800 p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-300">Elegi el modo</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            data-testid="menu-mode-word"
            className={`rounded-lg py-3 font-semibold transition ${mode === 'word' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            onClick={() => setMode('word')}
          >
            Palabra (4 letras)
          </button>
          <button
            data-testid="menu-mode-number"
            className={`rounded-lg py-3 font-semibold transition ${mode === 'number' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            onClick={() => setMode('number')}
          >
            Numero (4 digitos)
          </button>
        </div>
      </div>

      <button
        data-testid="menu-start-cpu"
        className="w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white hover:bg-emerald-500 transition"
        onClick={() => onStart(mode)}
      >
        Empezar
      </button>
    </div>
  )
}
