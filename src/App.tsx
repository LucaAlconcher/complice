import { useState } from 'react'
import { HomeScreen } from './components/HomeScreen'
import { CpuGame } from './modes/CpuGame'
import { MultiplayerGame } from './modes/MultiplayerGame'

type Screen = 'home' | 'cpu' | 'multiplayer'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  if (screen === 'cpu') return <CpuGame onExit={() => setScreen('home')} />
  if (screen === 'multiplayer') return <MultiplayerGame onExit={() => setScreen('home')} />

  return (
    <div className="min-h-screen bg-slate-950">
      <HomeScreen onSelectCpu={() => setScreen('cpu')} onSelectMultiplayer={() => setScreen('multiplayer')} />
    </div>
  )
}
