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
    <div className={cn('h-dvh overflow-hidden flex justify-center transition-colors duration-700', PHASE_BG[phase])}>
      {/* Portrait: single column. Short/landscape screens: timer | settings side by side. */}
      <div className="w-full max-w-sm h-full flex flex-col overflow-hidden [@media(orientation:landscape)_and_(max-height:600px)]:max-w-3xl [@media(orientation:landscape)_and_(max-height:600px)]:flex-row">

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

          <header className="shrink-0 flex items-center justify-center px-5 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-1">
            <h1 className="font-condensed font-bold text-xs tracking-[5px] uppercase text-teal-400 select-none">
              HIIT TIMER
            </h1>
          </header>

          <main className="flex-1 min-h-0 flex items-center justify-center px-5 py-1">
            <TimerDisplay
              phase={phase}
              timeLeft={timeLeft}
              currentRound={currentRound}
              totalRounds={settings.rounds}
              totalTime={totalTime}
            />
          </main>

          <div className="shrink-0">
            <ProgressBar phase={phase} timeLeft={timeLeft} totalTime={totalTime} />
          </div>

          <section className="shrink-0 px-5 py-3">
            <ControlButtons
              phase={phase}
              isRunning={isRunning}
              onStart={start}
              onPause={pause}
              onReset={reset}
            />
          </section>

        </div>

        <div className="shrink-0 overflow-hidden pb-[env(safe-area-inset-bottom)] [@media(orientation:landscape)_and_(max-height:600px)]:w-[19rem] [@media(orientation:landscape)_and_(max-height:600px)]:flex [@media(orientation:landscape)_and_(max-height:600px)]:flex-col [@media(orientation:landscape)_and_(max-height:600px)]:justify-center [@media(orientation:landscape)_and_(max-height:600px)]:pb-0 [@media(orientation:landscape)_and_(max-height:600px)]:[&>div]:border-t-0 [@media(orientation:landscape)_and_(max-height:600px)]:[&>div]:border-l">
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
