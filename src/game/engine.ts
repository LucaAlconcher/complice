import { computeFeedback } from './feedback'
import {
  ROUNDS_TO_WIN_MATCH,
  SECRET_LENGTH,
  type Feedback,
  type GameMode,
  type MatchState,
  type Participant,
  type RoundState,
} from './types'

interface NewParticipant {
  id: string
  name: string
  isCpu: boolean
}

/** Circle pairing: participant i must guess participant i+1's secret (wraps around). Works for 2+ players. */
export function pairInCircle(ids: string[]): Record<string, string> {
  const targets: Record<string, string> = {}
  ids.forEach((id, i) => {
    targets[id] = ids[(i + 1) % ids.length]
  })
  return targets
}

function buildRound(roundNumber: number, turnOrder: string[]): RoundState {
  return {
    roundNumber,
    phase: 'setting-secrets',
    turnOrder,
    starterId: turnOrder[0],
    currentTurnIndex: 0,
    winners: [],
    extraShotQueue: [],
    pendingAttempt: null,
  }
}

export function createMatch(mode: GameMode, players: NewParticipant[]): MatchState {
  const ids = players.map((p) => p.id)
  const targets = pairInCircle(ids)
  const participants: Participant[] = players.map((p) => ({
    id: p.id,
    name: p.name,
    isCpu: p.isCpu,
    targetId: targets[p.id],
    secret: '',
    attempts: [],
    roundWins: 0,
    wonRound: false,
    extraShotUsed: false,
    hadTurnThisRound: false,
  }))

  return {
    mode,
    participants,
    round: buildRound(1, ids),
    matchWinnerId: null,
    winTarget: ROUNDS_TO_WIN_MATCH,
  }
}

function cloneMatch(match: MatchState): MatchState {
  return {
    ...match,
    participants: match.participants.map((p) => ({ ...p, attempts: [...p.attempts] })),
    round: {
      ...match.round,
      turnOrder: [...match.round.turnOrder],
      winners: [...match.round.winners],
      extraShotQueue: [...match.round.extraShotQueue],
      pendingAttempt: match.round.pendingAttempt ? { ...match.round.pendingAttempt } : null,
    },
  }
}

function findParticipant(match: MatchState, id: string): Participant {
  const p = match.participants.find((x) => x.id === id)
  if (!p) throw new Error(`Participante desconocido: ${id}`)
  return p
}

export function setSecret(match: MatchState, participantId: string, secret: string): MatchState {
  const next = cloneMatch(match)
  findParticipant(next, participantId).secret = secret.toUpperCase()
  const allSet = next.participants.every((p) => p.secret.length === SECRET_LENGTH)
  if (allSet) {
    next.round.phase = 'playing'
    next.round.currentTurnIndex = 0
  }
  return next
}

export function currentTurnParticipantId(match: MatchState): string | null {
  const { round } = match
  if (round.phase === 'playing') {
    const order = round.turnOrder
    for (let step = 0; step < order.length; step++) {
      const id = order[(round.currentTurnIndex + step) % order.length]
      if (!findParticipantSafe(match, id)?.wonRound) return id
    }
    return null
  }
  if (round.phase === 'extra-shot') {
    return round.extraShotQueue[0] ?? null
  }
  return null
}

function findParticipantSafe(match: MatchState, id: string): Participant | undefined {
  return match.participants.find((p) => p.id === id)
}

function advancePlayingTurn(round: RoundState, participants: Participant[]) {
  const order = round.turnOrder
  for (let step = 1; step <= order.length; step++) {
    const idx = (round.currentTurnIndex + step) % order.length
    const candidate = participants.find((p) => p.id === order[idx])
    if (candidate && !candidate.wonRound) {
      round.currentTurnIndex = idx
      return
    }
  }
}

function finalizeRoundIfDone(match: MatchState) {
  const { round } = match
  if (round.phase === 'finished') {
    for (const winnerId of round.winners) {
      findParticipant(match, winnerId).roundWins += 1
    }
    const champion = match.participants.find((p) => p.roundWins >= match.winTarget)
    if (champion) {
      match.matchWinnerId = champion.id
    }
  }
}

export interface GuessOutcome {
  match: MatchState
  feedback: Feedback
  wonRound: boolean
}

/** Applies a graded feedback to the guesser's turn: records the win/turn-advance/extra-shot outcome. */
function applyAttemptOutcome(next: MatchState, guesserId: string, feedback: Feedback): GuessOutcome {
  const guesser = findParticipant(next, guesserId)
  const won = feedback.exact === SECRET_LENGTH
  guesser.hadTurnThisRound = true

  const { round } = next

  if (won) {
    guesser.wonRound = true
    if (round.phase === 'playing') {
      if (guesser.id === round.starterId) {
        round.phase = 'extra-shot'
        round.winners.push(guesser.id)
        round.extraShotQueue = round.turnOrder.filter(
          (id) => id !== guesser.id && !findParticipant(next, id).wonRound,
        )
        if (round.extraShotQueue.length === 0) round.phase = 'finished'
      } else {
        round.winners.push(guesser.id)
        round.phase = 'finished'
      }
    } else if (round.phase === 'extra-shot') {
      round.winners.push(guesser.id)
      round.extraShotQueue = round.extraShotQueue.filter((id) => id !== guesser.id)
      if (round.extraShotQueue.length === 0) round.phase = 'finished'
    }
  } else if (round.phase === 'playing') {
    advancePlayingTurn(round, next.participants)
  } else if (round.phase === 'extra-shot') {
    round.extraShotQueue = round.extraShotQueue.filter((id) => id !== guesser.id)
    if (round.extraShotQueue.length === 0) round.phase = 'finished'
  }

  finalizeRoundIfDone(next)

  return { match: next, feedback, wonRound: won }
}

/** Single-player / vs-CPU path: feedback is computed automatically, no manual grading needed. */
export function submitGuess(match: MatchState, guesserId: string, guess: string): GuessOutcome {
  const next = cloneMatch(match)
  const guesser = findParticipant(next, guesserId)
  const target = findParticipant(next, guesser.targetId)
  const feedback = computeFeedback(target.secret, guess.toUpperCase())

  guesser.attempts.push({
    turnNumber: guesser.attempts.length + 1,
    guesserId,
    guess: guess.toUpperCase(),
    feedback,
  })

  return applyAttemptOutcome(next, guesserId, feedback)
}

/** Multiplayer path, step 1: the guesser sends a guess that must be graded by the target before the turn resolves. */
export function submitGuessForGrading(match: MatchState, guesserId: string, guess: string): MatchState {
  const next = cloneMatch(match)
  next.round.pendingAttempt = { guesserId, guess: guess.toUpperCase() }
  return next
}

/** Multiplayer path, step 2: the target manually grades the pending guess. */
export function gradeAttempt(match: MatchState, feedback: Feedback): GuessOutcome {
  const next = cloneMatch(match)
  const pending = next.round.pendingAttempt
  if (!pending) throw new Error('No hay ningun intento pendiente de calificar')
  const guesser = findParticipant(next, pending.guesserId)

  guesser.attempts.push({
    turnNumber: guesser.attempts.length + 1,
    guesserId: pending.guesserId,
    guess: pending.guess,
    feedback,
  })
  next.round.pendingAttempt = null

  return applyAttemptOutcome(next, pending.guesserId, feedback)
}

/** Called when a turn's 1-minute timer expires without a submitted guess: the turn is forfeited. */
export function forfeitTurn(match: MatchState, participantId: string): MatchState {
  const next = cloneMatch(match)
  const participant = findParticipant(next, participantId)
  participant.hadTurnThisRound = true
  const { round } = next

  if (round.phase === 'playing') {
    advancePlayingTurn(round, next.participants)
  } else if (round.phase === 'extra-shot') {
    round.extraShotQueue = round.extraShotQueue.filter((id) => id !== participantId)
    if (round.extraShotQueue.length === 0) round.phase = 'finished'
  }

  finalizeRoundIfDone(next)
  return next
}

export function startNextRound(match: MatchState): MatchState {
  const next = cloneMatch(match)
  for (const p of next.participants) {
    p.secret = ''
    p.attempts = []
    p.wonRound = false
    p.extraShotUsed = false
    p.hadTurnThisRound = false
  }
  // rotate turn order so the round starter changes each round
  const rotated = [...next.round.turnOrder]
  rotated.push(rotated.shift()!)
  next.round = buildRound(next.round.roundNumber + 1, rotated)
  return next
}
