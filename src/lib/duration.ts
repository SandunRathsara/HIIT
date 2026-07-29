import type { Round, Workout } from '@/db/schema'

/** How long a round is expected to take. Reps rounds are an estimate only. */
export function roundWorkSeconds(round: Round): number {
  return round.mode === 'time' ? round.value : round.value * round.secondsPerRep
}

type Estimatable = Pick<Workout, 'prepareDelay' | 'prepareSeconds' | 'rounds'>

export function estimateWorkoutSeconds(workout: Estimatable): number {
  const prep = workout.prepareDelay ? workout.prepareSeconds : 0
  return workout.rounds.reduce(
    (total, round) => total + roundWorkSeconds(round) + round.restTime,
    prep,
  )
}

/** Summary style: 9:20 — minutes unpadded. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

/** Timer style: 00:27 — both parts padded. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const mm = String(Math.floor(safe / 60)).padStart(2, '0')
  const ss = String(safe % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export function rangeLabel(values: number[], suffix: string): string {
  if (values.length === 0) return '—'
  const min = Math.min(...values)
  const max = Math.max(...values)
  return min === max ? `${min}${suffix}` : `${min}–${max}${suffix}`
}

export function workRangeLabel(rounds: Round[]): string {
  return rangeLabel(
    rounds.filter(r => r.mode === 'time').map(r => r.value),
    's',
  )
}

export function restRangeLabel(rounds: Round[]): string {
  return rangeLabel(rounds.map(r => r.restTime), 's')
}

export function roundTargetLabel(round: Round): string {
  if (round.mode === 'time') return `${round.value}s`
  return `${round.value} ${round.value === 1 ? 'REP' : 'REPS'}`
}

/** Display name. Blank exercises fall back to the round number. */
export function roundExerciseLabel(round: Round): string {
  const trimmed = round.exercise.trim()
  return trimmed === '' ? `ROUND ${round.order}` : trimmed
}
