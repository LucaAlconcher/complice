export type GameMode = 'word' | 'number'

export interface Feedback {
  exact: number
  misplaced: number
}

export interface Attempt {
  turnNumber: number
  guesserId: string
  guess: string
  feedback: Feedback
}

export interface Participant {
  id: string
  name: string
  isCpu: boolean
  /** id of the participant whose secret this participant must guess */
  targetId: string
  secret: string
  attempts: Attempt[]
  roundWins: number
  /** true once this participant has correctly guessed their target's secret, for the current round */
  wonRound: boolean
  /** used to grant the one-time catch-up guess when the round starter wins first */
  extraShotUsed: boolean
  hadTurnThisRound: boolean
}

export type RoundPhase = 'setting-secrets' | 'playing' | 'extra-shot' | 'finished'

export interface PendingAttempt {
  guesserId: string
  guess: string
}

export interface RoundState {
  roundNumber: number
  phase: RoundPhase
  turnOrder: string[]
  starterId: string
  currentTurnIndex: number
  winners: string[]
  extraShotQueue: string[]
  /** a guess awaiting manual grading by the target/setter (multiplayer only) */
  pendingAttempt: PendingAttempt | null
}

export interface MatchState {
  mode: GameMode
  participants: Participant[]
  round: RoundState
  matchWinnerId: string | null
  winTarget: number
}

export const SECRET_LENGTH = 4
export const TURN_TIME_LIMIT_MS = 60_000
export const ROUNDS_TO_WIN_MATCH = 3
