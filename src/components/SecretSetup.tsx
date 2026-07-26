import { useState } from 'react'
import type { GameMode } from '../game/types'
import { isCompleteEntry, sanitizeInput, unknownWordWarning } from '../game/validation'

export function SecretSetup({
  mode,
  onConfirm,
}: {
  mode: GameMode
  onConfirm: (secret: string) => void
}) {
  const [value, setValue] = useState('')
  const complete = isCompleteEntry(mode, value)
  const warning = unknownWordWarning(mode, value)

  return (
    <div className="mx-auto max-w-md space-y-5 p-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-white">Elegi tu secreto</h2>
        <p className="text-sm text-slate-400">
          {mode === 'word' ? 'Una palabra real en espanol de 4 letras.' : 'Un codigo de 4 digitos.'}
        </p>
      </div>

      <input
        autoFocus
        data-testid="secret-input"
        value={value}
        onChange={(e) => setValue(sanitizeInput(mode, e.target.value))}
        placeholder={mode === 'word' ? 'CASA' : '1234'}
        className="w-full rounded-xl bg-slate-800 text-center text-3xl font-mono tracking-[0.5em] text-white py-4 outline-none focus:ring-2 focus:ring-emerald-500"
      />

      {warning && <p className="text-xs text-amber-400 text-center">{warning}</p>}

      <button
        data-testid="secret-confirm"
        disabled={!complete}
        onClick={() => onConfirm(value)}
        className="w-full rounded-xl bg-emerald-600 py-3 text-lg font-bold text-white transition disabled:bg-slate-700 disabled:text-slate-500"
      >
        Confirmar secreto
      </button>
    </div>
  )
}
