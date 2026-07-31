export type RoundMode = 'time' | 'reps'

export type PrepareSeconds = 5 | 10 | 15

export interface Round {
  /** 1-based position; always equals array index + 1. */
  order: number
  /** May be empty — the UI falls back to "ROUND n". */
  exercise: string
  mode: RoundMode
  /** Seconds when mode === 'time', repetition count when mode === 'reps'. */
  value: number
  /** Estimation pace for reps rounds. Ignored when mode === 'time'. */
  secondsPerRep: number
  /** Rest AFTER this round. On the last round this is the cool down. 0 skips it. */
  restTime: number
}

export interface Workout {
  id: number
  name: string
  prepareDelay: boolean
  prepareSeconds: PrepareSeconds
  rounds: Round[]
  createdAt: number
  /** null until the workout has been started at least once. */
  lastUsedAt: number | null
}

/** Records that a built-in workout has already been delivered to this database. */
export interface AppliedSeed {
  /** Matches `WorkoutSeed.id`. */
  id: string
  appliedAt: number
}

export const LIMITS = {
  workTime: { min: 5, max: 300, step: 5 },
  reps: { min: 1, max: 100, step: 1 },
  restTime: { min: 0, max: 300, step: 5 },
  secondsPerRep: { min: 1, max: 10, step: 1 },
  rounds: { min: 1, max: 30 },
  workoutNameChars: 40,
  exerciseNameChars: 30,
} as const

export const PRESETS = {
  workTime: [30, 40, 60],
  restTime: [15, 20, 60],
  reps: [10, 15, 20],
  prepareSeconds: [5, 10, 15],
} as const

export const DEFAULT_PREPARE_SECONDS: PrepareSeconds = 10

export const DEFAULT_ROUND: Omit<Round, 'order'> = {
  exercise: '',
  mode: 'time',
  value: 40,
  secondsPerRep: 3,
  restTime: 20,
}
