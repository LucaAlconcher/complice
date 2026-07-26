import { useState } from 'react'
import type { GameMode } from '../game/types'

export function MultiplayerLanding({
  onCreate,
  onJoin,
  onBack,
  error,
}: {
  onCreate: (name: string, mode: GameMode) => void
  onJoin: (name: string, code: string) => void
  onBack: () => void
  error: string | null
}) {
  const [view, setView] = useState<'choose' | 'create' | 'join'>('choose')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<GameMode>('word')
  const [code, setCode] = useState('')

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <button data-testid="back-home" onClick={onBack} className="text-sm text-slate-400 hover:text-slate-200">
        &larr; Volver
      </button>

      <h1 className="text-3xl font-bold text-white text-center">Multijugador</h1>

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      {view === 'choose' && (
        <div className="space-y-3">
          <button
            data-testid="mp-choose-create"
            onClick={() => setView('create')}
            className="w-full rounded-xl bg-emerald-600 py-4 font-bold text-white hover:bg-emerald-500 transition"
          >
            Crear sala
          </button>
          <button
            data-testid="mp-choose-join"
            onClick={() => setView('join')}
            className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white hover:bg-indigo-500 transition"
          >
            Unirme a una sala
          </button>
        </div>
      )}

      {view !== 'choose' && (
        <div className="space-y-4">
          <input
            data-testid="mp-name-input"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="Tu nombre"
            className="w-full rounded-xl bg-slate-800 text-center text-lg text-white py-3 outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {view === 'create' && (
            <>
              <div className="rounded-xl bg-slate-800 p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-300">Elegi el modo</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    data-testid="mp-mode-word"
                    className={`rounded-lg py-3 font-semibold transition ${mode === 'word' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                    onClick={() => setMode('word')}
                  >
                    Palabra (4 letras)
                  </button>
                  <button
                    data-testid="mp-mode-number"
                    className={`rounded-lg py-3 font-semibold transition ${mode === 'number' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                    onClick={() => setMode('number')}
                  >
                    Numero (4 digitos)
                  </button>
                </div>
              </div>
              <button
                data-testid="mp-create-submit"
                disabled={!name.trim()}
                onClick={() => onCreate(name.trim(), mode)}
                className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white disabled:bg-slate-700 disabled:text-slate-500"
              >
                Crear sala
              </button>
            </>
          )}

          {view === 'join' && (
            <>
              <input
                data-testid="mp-code-input"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))}
                placeholder="Codigo de sala"
                className="w-full rounded-xl bg-slate-800 text-center text-2xl font-mono tracking-widest text-white py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                data-testid="mp-join-submit"
                disabled={!name.trim() || code.trim().length < 4}
                onClick={() => onJoin(name.trim(), code.trim())}
                className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white disabled:bg-slate-700 disabled:text-slate-500"
              >
                Unirme
              </button>
            </>
          )}

          <button
            data-testid="mp-back-choose"
            onClick={() => setView('choose')}
            className="w-full text-sm text-slate-400 hover:text-slate-200"
          >
            Volver
          </button>
        </div>
      )}
    </div>
  )
}
