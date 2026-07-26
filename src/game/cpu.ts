import type { Attempt, GameMode } from './types'
import { computeFeedback } from './feedback'
import { SPANISH_4_LETTER_WORDS, randomSpanishWord } from './wordlist'
import { SECRET_LENGTH } from './types'

export function generateCpuSecret(mode: GameMode): string {
  if (mode === 'word') return randomSpanishWord()
  let digits = ''
  for (let i = 0; i < SECRET_LENGTH; i++) {
    digits += Math.floor(Math.random() * 10).toString()
  }
  return digits
}

function allNumberCandidates(): string[] {
  const candidates: string[] = []
  const max = 10 ** SECRET_LENGTH
  for (let n = 0; n < max; n++) {
    candidates.push(n.toString().padStart(SECRET_LENGTH, '0'))
  }
  return candidates
}

/**
 * Keeps only candidates that would have produced the same feedback history
 * against every previous guess the CPU made. Standard "consistent guess"
 * Mastermind strategy: not minimax-optimal, but converges quickly and is
 * cheap to compute for a 4-symbol secret.
 */
export function narrowCandidates(candidates: string[], history: Attempt[]): string[] {
  return candidates.filter((candidate) =>
    history.every((attempt) => {
      const fb = computeFeedback(candidate, attempt.guess)
      return fb.exact === attempt.feedback.exact && fb.misplaced === attempt.feedback.misplaced
    }),
  )
}

export function cpuNextGuess(mode: GameMode, history: Attempt[]): string {
  const fullPool = mode === 'word' ? [...SPANISH_4_LETTER_WORDS] : allNumberCandidates()
  const consistent = narrowCandidates(fullPool, history)
  const pool = consistent.length > 0 ? consistent : fullPool
  return pool[Math.floor(Math.random() * pool.length)]
}
