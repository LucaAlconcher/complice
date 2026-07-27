import { useTheme } from '../theme/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isPaper = theme === 'paper'

  return (
    <button
      data-testid="theme-toggle"
      onClick={toggleTheme}
      title={isPaper ? 'Cambiar a modo oscuro' : 'Cambiar a modo papel'}
      className="fixed top-3 right-3 z-50 flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 shadow-lg hover:text-white transition"
    >
      <span aria-hidden="true">{isPaper ? '🌙' : '📝'}</span>
      {isPaper ? 'Oscuro' : 'Papel'}
    </button>
  )
}
