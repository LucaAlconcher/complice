import type { Feedback } from './types'

/**
 * Classic Mastermind/Bulls & Cows scoring. Handles repeated characters correctly:
 * a character already consumed by an exact match cannot also count as misplaced.
 */
export function computeFeedback(secret: string, guess: string): Feedback {
  const secretChars = secret.split('')
  const guessChars = guess.split('')
  const secretLeftover: string[] = []
  const guessLeftover: string[] = []

  let exact = 0
  for (let i = 0; i < secretChars.length; i++) {
    if (guessChars[i] === secretChars[i]) {
      exact++
    } else {
      secretLeftover.push(secretChars[i])
      guessLeftover.push(guessChars[i])
    }
  }

  let misplaced = 0
  const remaining = [...secretLeftover]
  for (const ch of guessLeftover) {
    const idx = remaining.indexOf(ch)
    if (idx !== -1) {
      misplaced++
      remaining.splice(idx, 1)
    }
  }

  return { exact, misplaced }
}

export function isWinningFeedback(feedback: Feedback, secretLength: number): boolean {
  return feedback.exact === secretLength
}
