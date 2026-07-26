import { useEffect, useState } from 'react'
import type { GameMode } from '../game/types'
import { TURN_TIME_LIMIT_MS } from '../game/types'
import { currentTurnParticipantId } from '../game/engine'
import { useRoom } from '../multiplayer/useRoom'
import { MultiplayerLanding } from '../components/MultiplayerLanding'
import { Lobby } from '../components/Lobby'
import { SecretSetup } from '../components/SecretSetup'
import { MultiplayerPlayScreen } from '../components/MultiplayerPlayScreen'
import { RoundResult } from '../components/RoundResult'

export function MultiplayerGame({ onExit }: { onExit: () => void }) {
  const mp = useRoom()
  const [timeLeftMs, setTimeLeftMs] = useState(TURN_TIME_LIMIT_MS)

  const currentTurnId = mp.match ? currentTurnParticipantId(mp.match) : null
  const isMyTurn = currentTurnId !== null && currentTurnId === mp.myPlayerId

  // Local per-turn countdown; resets whenever the shared turn state changes, forfeits only when it's my turn.
  useEffect(() => {
    if (!mp.match || !mp.myPlayerId) return
    if (mp.match.round.phase !== 'playing' && mp.match.round.phase !== 'extra-shot') return
    if (currentTurnParticipantId(mp.match) !== mp.myPlayerId) return

    setTimeLeftMs(TURN_TIME_LIMIT_MS)
    const startedAt = Date.now()
    const interval = setInterval(() => {
      const remaining = TURN_TIME_LIMIT_MS - (Date.now() - startedAt)
      if (remaining <= 0) {
        clearInterval(interval)
        mp.forfeitMyTurn()
      } else {
        setTimeLeftMs(remaining)
      }
    }, 250)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mp.match?.round.currentTurnIndex, mp.match?.round.phase, mp.match?.round.extraShotQueue.length, mp.myPlayerId])

  async function handleCreate(name: string, mode: GameMode) {
    try {
      await mp.createRoom(name, mode)
    } catch (e) {
      mp.setError(e instanceof Error ? e.message : 'No se pudo crear la sala.')
    }
  }

  async function handleJoin(name: string, code: string) {
    try {
      await mp.joinRoom(code, name)
    } catch (e) {
      mp.setError(e instanceof Error ? e.message : 'No se pudo unir a la sala.')
    }
  }

  if (!mp.room) {
    return (
      <div className="min-h-screen bg-slate-950">
        <MultiplayerLanding onCreate={handleCreate} onJoin={handleJoin} onBack={onExit} error={mp.error} />
      </div>
    )
  }

  if (mp.room.status === 'lobby') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center">
        <Lobby code={mp.room.code} players={mp.players} isHost={mp.isHost} onStart={mp.startGame} />
      </div>
    )
  }

  if (!mp.match || !mp.myPlayerId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Cargando partida...</p>
      </div>
    )
  }

  if (mp.match.matchWinnerId) {
    const winner = mp.match.participants.find((p) => p.id === mp.match!.matchWinnerId)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center">
        <div className="mx-auto max-w-md space-y-5 p-6 text-center">
          <h2 className="text-3xl font-bold text-white">
            {mp.match.matchWinnerId === mp.myPlayerId ? 'Ganaste la partida!' : `Gano ${winner?.name}`}
          </h2>
          <p className="text-slate-400">Primero a {mp.match.winTarget} rondas ganadas.</p>
          <button onClick={onExit} className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white">
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  if (mp.match.round.phase === 'finished') {
    if (mp.isHost) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center">
          <RoundResult match={mp.match} humanId={mp.myPlayerId} onNextRound={mp.nextRound} />
        </div>
      )
    }
    const winners = mp.match.round.winners
    const tie = winners.length > 1
    const iWon = winners.includes(mp.myPlayerId)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center">
        <div className="mx-auto max-w-md space-y-5 p-6 text-center">
          <h2 className="text-2xl font-bold text-white">
            {tie ? 'Ronda empatada' : iWon ? 'Ganaste la ronda' : 'Perdiste esta ronda'}
          </h2>
          <p className="text-sm text-slate-400">Esperando a que el host pase a la siguiente ronda...</p>
        </div>
      </div>
    )
  }

  if (mp.match.round.phase === 'setting-secrets') {
    if (!mp.mySecret) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center">
          <SecretSetup mode={mp.match.mode} onConfirm={mp.setMySecret} />
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Esperando a que los demas elijan su secreto...</p>
      </div>
    )
  }

  const pending = mp.match.round.pendingAttempt
  const pendingForMe =
    pending && mp.match.participants.find((p) => p.id === pending.guesserId)?.targetId === mp.myPlayerId
      ? pending
      : null

  return (
    <div className="min-h-screen bg-slate-950">
      <MultiplayerPlayScreen
        mode={mp.match.mode}
        match={mp.match}
        myId={mp.myPlayerId}
        isMyTurn={isMyTurn}
        currentTurnId={currentTurnId}
        timeLeftMs={timeLeftMs}
        pendingForMe={pendingForMe}
        onSubmitGuess={mp.submitGuess}
        onGradeAttempt={mp.gradeAttempt}
      />
    </div>
  )
}
