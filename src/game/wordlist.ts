// Palabras reales en espanol de 4 letras (sin tildes ni enie, para simplificar el
// teclado de carga). Lista curada para el MVP; se puede ampliar mas adelante.
export const SPANISH_4_LETTER_WORDS = [
  'AMOR', 'CASA', 'MESA', 'PATO', 'GATO', 'TODO', 'VIDA', 'HORA', 'NOTA', 'ROSA',
  'LUNA', 'MOTO', 'COCO', 'LIMA', 'LOBO', 'RATA', 'MICO', 'PESO', 'MAPA', 'ROPA',
  'TAZA', 'CAJA', 'CINE', 'AGUA', 'AIRE', 'NUBE', 'LAGO', 'ISLA', 'PICO', 'FLOR',
  'HOJA', 'RAMA', 'UVAS', 'PERA', 'TREN', 'AUTO', 'BICI', 'RUTA', 'PISO', 'CAMA',
  'VASO', 'OLLA', 'DADO', 'DUNA', 'FOCA', 'RANA', 'LORO', 'PUMA', 'MULA', 'VACA',
  'PATA', 'ALAS', 'NIDO', 'ARCO', 'LAZO', 'NUDO', 'SACO', 'BOTA', 'AMAR', 'REIR',
  'ATAR', 'ARAR', 'CAER', 'LEER', 'USAR', 'ORAR', 'ROER', 'OLER', 'ASAR', 'HUIR',
  'IZAR', 'ALTO', 'BAJO', 'ROJO', 'AZUL', 'GRIS', 'VIVO', 'FRIO', 'MALO', 'BUEN',
  'SANO', 'LOCO', 'ESTO', 'ESTA', 'ESTE', 'ESOS', 'ESAS', 'AQUI', 'ALLA', 'POCO',
  'NADA', 'CADA', 'CUAL', 'CERO', 'DIEZ', 'SEIS', 'OCHO', 'TRES', 'DOCE', 'OJOS',
  'BOCA', 'PIEL', 'MANO', 'PIES', 'CARA', 'CODO', 'SOPA', 'MIEL', 'VINO', 'CAFE',
  'MAMA', 'PAPA', 'HIJO', 'HIJA', 'TIOS',
] as const

const WORD_SET: Set<string> = new Set(SPANISH_4_LETTER_WORDS)

export function normalizeWord(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
}

export function isKnownSpanishWord(word: string): boolean {
  return WORD_SET.has(normalizeWord(word))
}

export function randomSpanishWord(exclude: string[] = []): string {
  const excluded = new Set(exclude.map(normalizeWord))
  const pool = SPANISH_4_LETTER_WORDS.filter((w) => !excluded.has(w))
  const candidates = pool.length > 0 ? pool : SPANISH_4_LETTER_WORDS
  return candidates[Math.floor(Math.random() * candidates.length)]
}
