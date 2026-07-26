import type { RoomPlayerRow } from '../multiplayer/dbTypes'

export function Lobby({
  code,
  players,
  isHost,
  onStart,
}: {
  code: string
  players: RoomPlayerRow[]
  isHost: boolean
  onStart: () => void
}) {
  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Sala de espera</h2>
        <p className="text-sm text-slate-400">Comparti este codigo con tus amigos</p>
        <p data-testid="room-code" className="text-4xl font-mono tracking-[0.3em] text-emerald-400 font-bold">
          {code}
        </p>
      </div>

      <div className="rounded-xl bg-slate-800 p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase">Jugadores ({players.length})</p>
        {players.map((p) => (
          <div key={p.id} className="flex items-center justify-between text-slate-200">
            <span>{p.name}</span>
            {p.is_host && <span className="text-xs text-indigo-400 font-semibold">HOST</span>}
          </div>
        ))}
      </div>

      {isHost ? (
        <button
          data-testid="start-game"
          disabled={players.length < 2}
          onClick={onStart}
          className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white disabled:bg-slate-700 disabled:text-slate-500"
        >
          {players.length < 2 ? 'Esperando a mas jugadores...' : 'Empezar partida'}
        </button>
      ) : (
        <p className="text-center text-sm text-slate-400">Esperando a que el host empiece la partida...</p>
      )}
    </div>
  )
}
