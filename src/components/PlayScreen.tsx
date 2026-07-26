import { useState } from 'react'
import type { GameMode, MatchState } from '../game/types'
import { SECRET_LENGTH, TURN_TIME_LIMIT_MS } from '../game/types'
import { isCompleteEntry, sanitizeInput } from '../game/validation'
import { formatMs } from '../game/time'
import { AttemptList } from './AttemptList'
import { Scoreboard } from './Scoreboard'

export function PlayScreen({
  mode,
  match,
  humanId,
  cpuId,
  isHumanTurn,
  isCpuThinking,
  timeLeftMs,
  onSubmitGuess,
}: {
  mode: GameMode
  match: MatchState
  humanId: string
  cpuId: string
  isHumanTurn: boolean
  isCpuThinking: boolean
  timeLeftMs: number
  onSubmitGuess: (guess: string) => void
}) {
  const [guess, setGuess] = useState('')
  const human = match.participants.find((p) => p.id === humanId)!
  const cpu = match.participants.find((p) => p.id === cpuId)!
  const complete = isCompleteEntry(mode, guess)
  const extraShot = match.round.phase === 'extra-shot'

  const submit = () => {
    if (!complete) return
    onSubmitGuess(guess)
    setGuess('')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <Scoreboard match={match} />

      {extraShot && (
        <div className="rounded-xl bg-amber-500/20 border border-amber-500 px-4 py-3 text-center text-amber-300 font-semibold">
          Tiro extra: {match.round.starterId === humanId ? 'vos' : 'la CPU'} arranco y acerto primero.{' '}
          {match.round.starterId === humanId ? 'La CPU' : 'Vos'} tiene una ultima chance para empatar la ronda.
        </div>
      )}

      <div className="rounded-xl bg-slate-800 p-4 text-center space-y-3">
        {isHumanTurn ? (
          <>
            <p className="text-sm text-slate-400">
              Tu turno: adivina el secreto de la CPU ({SECRET_LENGTH} {mode === 'word' ? 'letras' : 'digitos'})
            </p>
            <p className="text-2xl font-mono text-emerald-400">{formatMs(timeLeftMs)}</p>
            <input
              autoFocus
              data-testid="guess-input"
              value={guess}
              onChange={(e) => setGuess(sanitizeInput(mode, e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="w-full rounded-xl bg-slate-900 text-center text-3xl font-mono tracking-[0.5em] text-white py-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              data-testid="guess-submit"
              disabled={!complete}
              onClick={submit}
              className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white disabled:bg-slate-700 disabled:text-slate-500"
            >
              Enviar intento
            </button>
          </>
        ) : (
          <p className="text-slate-400 py-6">
            {isCpuThinking ? 'La maquina esta pensando su intento...' : 'Esperando a la CPU...'}
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <AttemptList title="Tus intentos contra la CPU" participant={human} />
        <AttemptList title="Intentos de la CPU contra vos" participant={cpu} />
      </div>

      <p className="text-center text-xs text-slate-500">
        Tiempo limite por turno: {Math.round(TURN_TIME_LIMIT_MS / 1000)}s. Si se acaba, se pierde el turno.
      </p>
    </div>
  )
}
