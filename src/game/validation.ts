import type { GameMode } from './types'
import { SECRET_LENGTH } from './types'
import { isKnownSpanishWord, normalizeWord } from './wordlist'

export function sanitizeInput(mode: GameMode, raw: string): string {
  if (mode === 'number') return raw.replace(/[^0-9]/g, '').slice(0, SECRET_LENGTH)
  return normalizeWord(raw).replace(/[^A-Z]/g, '').slice(0, SECRET_LENGTH)
}

export function isCompleteEntry(mode: GameMode, value: string): boolean {
  if (value.length !== SECRET_LENGTH) return false
  return mode === 'number' ? /^[0-9]{4}$/.test(value) : /^[A-Z]{4}$/.test(value)
}

export function unknownWordWarning(mode: GameMode, value: string): string | null {
  if (mode !== 'word') return null
  if (!isCompleteEntry(mode, value)) return null
  if (isKnownSpanishWord(value)) return null
  return 'No reconocemos esa palabra en nuestro diccionario, pero podés usarla igual.'
}
