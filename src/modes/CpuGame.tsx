import { useEffect, useRef, useState } from 'react'
import type { GameMode, MatchState } from '../game/types'
import { TURN_TIME_LIMIT_MS } from '../game/types'
import { createMatch, currentTurnParticipantId, forfeitTurn, setSecret, startNextRound, submitGuess } from '../game/engine'
import { generateCpuSecret, cpuNextGuess } from '../game/cpu'
import { ModePicker } from '../components/ModePicker'
import { SecretSetup } from '../components/SecretSetup'
import { PlayScreen } from '../components/PlayScreen'
import { RoundResult } from '../components/RoundResult'
import { MatchOver } from '../components/MatchOver'

const HUMAN_ID = 'human'
const CPU_ID = 'cpu'

export function CpuGame({ onExit }: { onExit: () => void }) {
  const [mode, setMode] = useState<GameMode>('word')
  const [match, setMatch] = useState<MatchState | null>(null)
  const [turnVersion, setTurnVersion] = useState(0)
  const [timeLeftMs, setTimeLeftMs] = useState(TURN_TIME_LIMIT_MS)
  const [cpuThinking, setCpuThinking] = useState(false)
  const cpuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const advance = (next: MatchState) => {
    setMatch(next)
    setTurnVersion((v) => v + 1)
  }

  function startMatch(chosenMode: GameMode) {
    setMode(chosenMode)
    const fresh = createMatch(chosenMode, [
      { id: HUMAN_ID, name: 'Vos', isCpu: false },
      { id: CPU_ID, name: 'CPU', isCpu: true },
    ])
    advance(setSecret(fresh, CPU_ID, generateCpuSecret(chosenMode)))
  }

  function confirmHumanSecret(secret: string) {
    if (!match) return
    advance(setSecret(match, HUMAN_ID, secret))
  }

  function submitHumanGuess(guess: string) {
    if (!match) return
    const outcome = submitGuess(match, HUMAN_ID, guess)
    advance(outcome.match)
  }

  function nextRound() {
    if (!match) return
    const rotated = startNextRound(match)
    advance(setSecret(rotated, CPU_ID, generateCpuSecret(mode)))
  }

  function restartMatch() {
    setMatch(null)
  }

  // Auto-play the CPU's turn.
  useEffect(() => {
    if (!match) return
    if (match.round.phase !== 'playing' && match.round.phase !== 'extra-shot') return
    const turnId = currentTurnParticipantId(match)
    if (turnId !== CPU_ID) return

    setCpuThinking(true)
    cpuTimeoutRef.current = setTimeout(() => {
      const cpu = match.participants.find((p) => p.id === CPU_ID)!
      const guess = cpuNextGuess(mode, cpu.attempts)
      const outcome = submitGuess(match, CPU_ID, guess)
      setCpuThinking(false)
      advance(outcome.match)
    }, 1100)

    return () => {
      if (cpuTimeoutRef.current) clearTimeout(cpuTimeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, turnVersion])

  // Turn timer for the human player.
  useEffect(() => {
    if (!match) return
    if (match.round.phase !== 'playing' && match.round.phase !== 'extra-shot') return
    if (currentTurnParticipantId(match) !== HUMAN_ID) return

    setTimeLeftMs(TURN_TIME_LIMIT_MS)
    const startedAt = Date.now()
    const interval = setInterval(() => {
      const remaining = TURN_TIME_LIMIT_MS - (Date.now() - startedAt)
      if (remaining <= 0) {
        clearInterval(interval)
        setMatch((current) => {
          if (!current) return current
          if (currentTurnParticipantId(current) !== HUMAN_ID) return current
          const next = forfeitTurn(current, HUMAN_ID)
          setTurnVersion((v) => v + 1)
          return next
        })
      } else {
        setTimeLeftMs(remaining)
      }
    }, 250)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, turnVersion])

  if (!match) {
    return (
      <div className="min-h-screen bg-slate-950">
        <ModePicker onStart={startMatch} onBack={onExit} />
      </div>
    )
  }

  if (match.matchWinnerId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center">
        <MatchOver match={match} humanId={HUMAN_ID} onRestart={restartMatch} />
      </div>
    )
  }

  if (match.round.phase === 'finished') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center">
        <RoundResult match={match} humanId={HUMAN_ID} onNextRound={nextRound} />
      </div>
    )
  }

  if (match.round.phase === 'setting-secrets') {
    const human = match.participants.find((p) => p.id === HUMAN_ID)!
    if (human.secret) return null // waiting for cpu secret effect (synchronous, should not linger)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center">
        <SecretSetup mode={mode} onConfirm={confirmHumanSecret} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <PlayScreen
        mode={mode}
        match={match}
        humanId={HUMAN_ID}
        cpuId={CPU_ID}
        isHumanTurn={currentTurnParticipantId(match) === HUMAN_ID}
        isCpuThinking={cpuThinking}
        timeLeftMs={timeLeftMs}
        onSubmitGuess={submitHumanGuess}
      />
    </div>
  )
}
