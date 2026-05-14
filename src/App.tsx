import { useHiitTimer } from '@/hooks/useHiitTimer'
import { TimerDisplay } from '@/components/TimerDisplay'
import { ProgressBar } from '@/components/ProgressBar'
import { ControlButtons } from '@/components/ControlButtons'
import { SettingsPanel } from '@/components/SettingsPanel'
import type { Phase } from '@/hooks/useHiitTimer'
import { cn } from '@/lib/utils'

function getPhaseTotalTime(phase: Phase, settings: { workTime: number; restTime: number }): number {
  if (phase === 'prep') return 5
  if (phase === 'work') return settings.workTime
  if (phase === 'rest') return settings.restTime
  return 0
}

const PHASE_BG: Record<Phase, string> = {
  idle: 'bg-[#0d1b2a]',
  prep: 'bg-[#19130a]',
  work: 'bg-[#1a0c00]',
  rest: 'bg-[#00091c]',
  done: 'bg-[#001a0e]',
}

export default function App() {
  const { phase, timeLeft, currentRound, settings, isRunning, start, pause, reset, updateSetting } = useHiitTimer()
  const isLocked = phase !== 'idle'
  const totalTime = getPhaseTotalTime(phase, settings)

  return (
    <div className={cn('min-h-dvh flex justify-center transition-colors duration-700', PHASE_BG[phase])}>
      <div className="w-full max-w-sm flex flex-col min-h-dvh">

        <header className="flex items-center justify-center px-5 pt-6 pb-2">
          <h1 className="font-condensed font-bold text-xs tracking-[5px] uppercase text-teal-400 select-none">
            HIIT TIMER
          </h1>
        </header>

        <main className="flex-1 flex items-center justify-center py-2">
          <TimerDisplay
            phase={phase}
            timeLeft={timeLeft}
            currentRound={currentRound}
            totalRounds={settings.rounds}
            totalTime={totalTime}
          />
        </main>

        <ProgressBar phase={phase} timeLeft={timeLeft} totalTime={totalTime} />

        <section className="px-5 py-4">
          <ControlButtons
            phase={phase}
            isRunning={isRunning}
            onStart={start}
            onPause={pause}
            onReset={reset}
          />
        </section>

        <SettingsPanel
          settings={settings}
          isLocked={isLocked}
          onUpdate={updateSetting}
        />

      </div>
    </div>
  )
}
