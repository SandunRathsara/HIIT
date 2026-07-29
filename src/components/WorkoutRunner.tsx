import { useCallback, useEffect } from 'react'
import { useNavigate, useBlocker, type BlockerFunction } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import type { Workout } from '@/db/schema'
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer'
import { useWakeLock } from '@/hooks/useWakeLock'
import { markUsed } from '@/db/workoutRepo'
import { PreStartPanel } from '@/components/PreStartPanel'
import { describePhase } from '@/lib/phaseView'
import { TimerDisplay } from '@/components/TimerDisplay'
import { ProgressBar } from '@/components/ProgressBar'
import { ControlButtons } from '@/components/ControlButtons'
import { ConfirmSheet } from '@/components/ConfirmSheet'
import { CompletePanel } from '@/components/CompletePanel'
import { cn } from '@/lib/utils'
import type { Phase } from '@/hooks/useWorkoutTimer'

interface WorkoutRunnerProps {
  workout: Workout
}

const PHASE_BG: Record<Phase, string> = {
  idle: 'bg-[#0d1b2a]',
  prep: 'bg-[#19130a]',
  work: 'bg-[#1a0c00]',
  rest: 'bg-[#00091c]',
  cooldown: 'bg-[#001417]',
  done: 'bg-[#001a0e]',
}

export function WorkoutRunner({ workout }: WorkoutRunnerProps) {
  const navigate = useNavigate()
  const timer = useWorkoutTimer(workout)
  const isActive = timer.phase !== 'idle' && timer.phase !== 'done'

  // Blocks the header back arrow AND Android hardware back — both route through
  // the data router, so one hook covers both.
  const shouldBlock = useCallback<BlockerFunction>(() => isActive, [isActive])
  const blocker = useBlocker(shouldBlock)

  // react-router only re-registers `shouldBlock` when `isActive` flips — it
  // never un-blocks an already-blocked blocker on its own, so the quit sheet
  // would otherwise stay mounted over the completion screen.
  useEffect(() => {
    if (blocker.state === 'blocked' && !isActive) blocker.reset()
  }, [blocker, isActive])

  useWakeLock(isActive && timer.isRunning)

  function handleStart() {
    void markUsed(workout.id, Date.now())
    timer.start()
  }

  const view = describePhase({
    phase: timer.phase,
    currentRound: timer.currentRound,
    nextRound: timer.nextRound,
  })

  return (
    <div className={cn('screen-fixed flex justify-center transition-colors duration-700', PHASE_BG[timer.phase])}>
      <div className="flex h-full w-full max-w-sm flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-2 px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-1">
          <button
            type="button"
            aria-label="Back to workouts"
            onClick={() => navigate('/')}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <h1 className="min-w-0 flex-1 truncate font-condensed text-sm font-bold tracking-[3px] text-teal-400 uppercase select-none">
            {workout.name}
          </h1>
          <span className="w-11 shrink-0" aria-hidden="true" />
        </header>

        {timer.phase === 'idle' ? (
          <div className="min-h-0 flex-1">
            <PreStartPanel workout={workout} onStart={handleStart} />
          </div>
        ) : timer.phase === 'done' ? (
          <div className="min-h-0 flex-1">
            <CompletePanel
              workoutName={workout.name}
              rounds={workout.rounds.length}
              totalSeconds={timer.totalElapsed}
              onAgain={timer.reset}
              onBackToList={() => navigate('/')}
            />
          </div>
        ) : (
          <>
            <main className="flex min-h-0 flex-1 items-center justify-center px-5 py-1">
              <TimerDisplay
                phase={timer.phase}
                view={view}
                timeLeft={timer.timeLeft}
                elapsed={timer.elapsed}
                repsTarget={timer.isRepsRound ? (timer.currentRound?.value ?? null) : null}
                currentRound={timer.roundIndex + 1}
                totalRounds={workout.rounds.length}
                phaseTotal={timer.phaseTotal}
              />
            </main>

            <div className="shrink-0">
              <ProgressBar phase={timer.phase} timeLeft={timer.timeLeft} totalTime={timer.phaseTotal} />
            </div>

            <section className="shrink-0 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <ControlButtons
                phase={timer.phase}
                isRunning={timer.isRunning}
                isRepsRound={timer.isRepsRound}
                onResume={timer.start}
                onPause={timer.pause}
                onCompleteReps={timer.completeReps}
                onReset={timer.reset}
              />
            </section>
          </>
        )}
      </div>

      <ConfirmSheet
        open={blocker.state === 'blocked'}
        title="Quit workout?"
        body={`Round ${timer.roundIndex + 1} of ${workout.rounds.length}`}
        confirmLabel="Quit"
        cancelLabel="Keep going"
        tone="danger"
        onConfirm={() => {
          timer.reset()
          blocker.proceed?.()
        }}
        onCancel={() => blocker.reset?.()}
      />
    </div>
  )
}
