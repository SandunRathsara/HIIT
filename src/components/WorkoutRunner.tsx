import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import type { Workout } from '@/db/schema'
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer'
import { useWakeLock } from '@/hooks/useWakeLock'
import { markUsed } from '@/db/workoutRepo'
import { PreStartPanel } from '@/components/PreStartPanel'

interface WorkoutRunnerProps {
  workout: Workout
}

export function WorkoutRunner({ workout }: WorkoutRunnerProps) {
  const navigate = useNavigate()
  const timer = useWorkoutTimer(workout)
  const isActive = timer.phase !== 'idle' && timer.phase !== 'done'

  useWakeLock(isActive && timer.isRunning)

  function handleStart() {
    void markUsed(workout.id, Date.now())
    timer.start()
  }

  return (
    <div className="screen-fixed flex justify-center bg-[#0d1b2a]">
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

        <div className="min-h-0 flex-1">
          <PreStartPanel workout={workout} onStart={handleStart} />
        </div>
      </div>
    </div>
  )
}
