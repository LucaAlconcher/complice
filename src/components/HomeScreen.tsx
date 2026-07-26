export function HomeScreen({
  onSelectCpu,
  onSelectMultiplayer,
}: {
  onSelectCpu: () => void
  onSelectMultiplayer: () => void
}) {
  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-white">Cómplice</h1>
        <p className="text-slate-400 text-sm">
          Adivina el secreto de tu rival. Vos calificas sus intentos, el sistema no hace trampa por vos.
        </p>
      </div>

      <button
        data-testid="home-cpu"
        onClick={onSelectCpu}
        className="w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white hover:bg-emerald-500 transition"
      >
        Jugar contra la Maquina
      </button>

      <button
        data-testid="home-multiplayer"
        onClick={onSelectMultiplayer}
        className="w-full rounded-xl bg-indigo-600 py-4 text-lg font-bold text-white hover:bg-indigo-500 transition"
      >
        Jugar Multijugador
      </button>
    </div>
  )
}
