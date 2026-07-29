import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { listWorkouts } from '@/db/workoutRepo'
import { WorkoutCard } from '@/components/WorkoutCard'
import { EmptyState } from '@/components/EmptyState'

function CardSkeleton() {
  return <div className="h-[86px] animate-pulse rounded-2xl bg-slate-900/50" />
}

export function WorkoutListScreen() {
  const navigate = useNavigate()
  const workouts = useLiveQuery(() => listWorkouts(), [])
  // Stamped once per render pass; relative labels are coarse enough that this
  // never looks stale within a session.
  const now = Date.now()

  return (
    <div className="screen-scroll">
      <div className="mx-auto flex w-full max-w-sm flex-col px-5 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
        <h1 className="mb-5 font-condensed text-xs font-bold tracking-[5px] text-teal-400 uppercase select-none">
          Workouts
        </h1>

        {workouts === undefined && (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading workouts">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {workouts?.length === 0 && <EmptyState />}

        {workouts && workouts.length > 0 && (
          <ul className="flex flex-col gap-3">
            {workouts.map(workout => (
              <li key={workout.id}>
                <WorkoutCard
                  workout={workout}
                  now={now}
                  onOpen={() => navigate(`/workout/${workout.id}`)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        aria-label="Create a workout"
        onClick={() => navigate('/new')}
        className="fixed right-5 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-20 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-teal-500 text-slate-900 shadow-lg shadow-teal-500/25 transition-colors duration-200 hover:bg-teal-400 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <Plus className="h-7 w-7" aria-hidden="true" />
      </button>
    </div>
  )
}
