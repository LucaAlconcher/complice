import { useState } from 'react'
import type { GameMode, MatchState, PendingAttempt } from '../game/types'
import { SECRET_LENGTH, TURN_TIME_LIMIT_MS } from '../game/types'
import { isCompleteEntry, sanitizeInput } from '../game/validation'
import { formatMs } from '../game/time'
import { AttemptList } from './AttemptList'
import { Scoreboard } from './Scoreboard'
import { GradingPanel } from './GradingPanel'

export function MultiplayerPlayScreen({
  mode,
  match,
  myId,
  isMyTurn,
  currentTurnId,
  timeLeftMs,
  pendingForMe,
  onSubmitGuess,
  onGradeAttempt,
}: {
  mode: GameMode
  match: MatchState
  myId: string
  isMyTurn: boolean
  currentTurnId: string | null
  timeLeftMs: number
  pendingForMe: PendingAttempt | null
  onSubmitGuess: (guess: string) => void
  onGradeAttempt: (exact: number, misplaced: number) => void
}) {
  const [guess, setGuess] = useState('')
  const me = match.participants.find((p) => p.id === myId)!
  const target = match.participants.find((p) => p.id === me.targetId)!
  const guesser = match.participants.find((p) => p.targetId === myId)!
  const complete = isCompleteEntry(mode, guess)
  const extraShot = match.round.phase === 'extra-shot'
  const starterName = match.participants.find((p) => p.id === match.round.starterId)?.name ?? '???'
  const currentTurnName = match.participants.find((p) => p.id === currentTurnId)?.name ?? '...'
  const awaitingGrade = match.round.pendingAttempt?.guesserId === myId

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
          Tiro extra: {match.round.starterId === myId ? 'vos arrancaste' : `${starterName} arranco`} y acerto
          primero. Los demas tienen una ultima chance para empatar la ronda.
        </div>
      )}

      {pendingForMe && (
        <GradingPanel
          pending={pendingForMe}
          guesserName={match.participants.find((p) => p.id === pendingForMe.guesserId)?.name ?? '???'}
          mySecret={me.secret}
          onGrade={onGradeAttempt}
        />
      )}

      <div className="rounded-xl bg-slate-800 p-4 text-center space-y-3">
        {isMyTurn && !awaitingGrade ? (
          <>
            <p className="text-sm text-slate-400">
              Tu turno: adivina el secreto de {target.name} ({SECRET_LENGTH} {mode === 'word' ? 'letras' : 'digitos'})
            </p>
            <p className="text-2xl font-mono text-emerald-400">{formatMs(timeLeftMs)}</p>
            <input
              autoFocus
              data-testid="mp-guess-input"
              value={guess}
              onChange={(e) => setGuess(sanitizeInput(mode, e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="w-full rounded-xl bg-slate-900 text-center text-3xl font-mono tracking-[0.5em] text-white py-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              data-testid="mp-guess-submit"
              disabled={!complete}
              onClick={submit}
              className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white disabled:bg-slate-700 disabled:text-slate-500"
            >
              Enviar intento
            </button>
          </>
        ) : (
          <p className="text-slate-400 py-6">
            {pendingForMe
              ? 'Califica el intento de arriba para continuar.'
              : awaitingGrade
                ? `Esperando a que ${target.name} califique tu intento...`
                : `Esperando el turno de ${currentTurnName}`}
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <AttemptList title={`Tus intentos contra ${target.name}`} participant={me} />
        <AttemptList title={`Intentos de ${guesser.name} contra vos`} participant={guesser} />
      </div>

      <p className="text-center text-xs text-slate-500">
        Tiempo limite por turno: {Math.round(TURN_TIME_LIMIT_MS / 1000)}s. Si se acaba, se pierde el turno.
      </p>
    </div>
  )
}
