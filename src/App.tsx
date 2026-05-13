import { useHiitTimer } from '@/hooks/useHiitTimer'
import { TimerDisplay } from '@/components/TimerDisplay'
import { ProgressBar } from '@/components/ProgressBar'
import { ControlButtons } from '@/components/ControlButtons'
import { SettingsPanel } from '@/components/SettingsPanel'
import type { Phase } from '@/hooks/useHiitTimer'

function getPhaseTotalTime(phase: Phase, settings: { workTime: number; restTime: number }): number {
  if (phase === 'prep') return 5
  if (phase === 'work') return settings.workTime
  if (phase === 'rest') return settings.restTime
  return 0
}

export default function App() {
  const { phase, timeLeft, currentRound, settings, isRunning, start, pause, reset, updateSetting } = useHiitTimer()
  const isLocked = phase !== 'idle'
  const totalTime = getPhaseTotalTime(phase, settings)

  return (
    <div className="min-h-screen bg-[#0d1b2a] flex items-start justify-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen">
        <div className="bg-slate-950 px-5 py-4 text-center border-b border-slate-800">
          <h1 className="text-teal-400 font-extrabold text-sm tracking-[3px] uppercase">
            HIIT TIMER
          </h1>
        </div>
        <div className="flex-1 flex flex-col">
          <TimerDisplay
            phase={phase}
            timeLeft={timeLeft}
            currentRound={currentRound}
            totalRounds={settings.rounds}
          />
          <ProgressBar phase={phase} timeLeft={timeLeft} totalTime={totalTime} />
          <ControlButtons
            phase={phase}
            isRunning={isRunning}
            onStart={start}
            onPause={pause}
            onReset={reset}
          />
          <SettingsPanel
            settings={settings}
            isLocked={isLocked}
            onUpdate={updateSetting}
          />
        </div>
      </div>
    </div>
  )
}
