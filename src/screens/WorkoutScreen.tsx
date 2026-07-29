import { Navigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { getWorkout } from '@/db/workoutRepo'
import { WorkoutRunner } from '@/components/WorkoutRunner'

export function WorkoutScreen() {
  const { id } = useParams()
  const workoutId = Number(id)

  // `?? null` distinguishes "still loading" (undefined) from "not found" (null).
  const workout = useLiveQuery(
    async () => (Number.isFinite(workoutId) ? ((await getWorkout(workoutId)) ?? null) : null),
    [workoutId],
  )

  if (workout === undefined) {
    return (
      <div className="screen-fixed flex items-center justify-center" aria-busy="true">
        <div className="h-40 w-40 animate-pulse rounded-full bg-slate-900/60" />
      </div>
    )
  }

  if (workout === null) return <Navigate to="/" replace />

  // Remount the whole runner if the workout id changes, so timer state never leaks between workouts.
  return <WorkoutRunner key={workout.id} workout={workout} />
}
