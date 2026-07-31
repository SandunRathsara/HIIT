import { DEFAULT_PREPARE_SECONDS, DEFAULT_ROUND, type Round } from './schema'
// Type-only: erased at build time, so this does not create a runtime import
// of workoutRepo (which imports the live `db`).
import type { NewWorkout } from './workoutRepo'

/** A built-in workout shipped with the app. */
export interface WorkoutSeed {
  /**
   * Stable and never reused. Recorded in `appliedSeeds` once delivered, so
   * changing it would re-deliver the workout to every existing install.
   */
  id: string
  workout: NewWorkout
}

const TEN_MINUTE_EXERCISES = [
  'Jumping Jacks',
  'High Knees',
  'Switching Lunges',
  'Butt Kicks',
  'Squat Taps',
  'Burpees',
  'In & Outs',
  'Switching Mountain Climbers',
  'Plank Side to Side',
  'Bicycles',
]

/** Every round of the 10-minute routine is 40s of work then 20s of rest. */
function timedRound(exercise: string, index: number): Round {
  return {
    order: index + 1,
    exercise,
    mode: 'time',
    value: 40,
    // Ignored in time mode, but Round requires a value.
    secondsPerRep: DEFAULT_ROUND.secondsPerRep,
    restTime: 20,
  }
}

export const WORKOUT_SEEDS: WorkoutSeed[] = [
  {
    id: 'ten-minute-hiit-v1',
    workout: {
      name: '10-Minute HIIT',
      prepareDelay: true,
      prepareSeconds: DEFAULT_PREPARE_SECONDS,
      // Round 10 keeps its 20s rest, which the schema treats as the cool
      // down — that is what makes work plus rest land on exactly 600s.
      rounds: TEN_MINUTE_EXERCISES.map(timedRound),
    },
  },
]
