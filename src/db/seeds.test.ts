import { describe, it, expect } from 'vitest'
import { WORKOUT_SEEDS, type WorkoutSeed } from './seeds'
import { LIMITS } from './schema'
import { estimateWorkoutSeconds, roundWorkSeconds } from '@/lib/duration'

function seedById(id: string): WorkoutSeed {
  const seed = WORKOUT_SEEDS.find(candidate => candidate.id === id)
  if (!seed) throw new Error(`No seed with id ${id}`)
  return seed
}

describe('WORKOUT_SEEDS', () => {
  it('has unique ids', () => {
    const ids = WORKOUT_SEEDS.map(seed => seed.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('numbers every round contiguously from 1', () => {
    for (const seed of WORKOUT_SEEDS) {
      expect(seed.workout.rounds.map(round => round.order)).toEqual(
        seed.workout.rounds.map((_, i) => i + 1),
      )
    }
  })

  // A seed the create form would have rejected is a bug — it would be an
  // un-editable workout holding values the user could never have entered.
  it('stays inside the limits the create form enforces', () => {
    for (const seed of WORKOUT_SEEDS) {
      expect(seed.workout.name.trim()).not.toBe('')
      expect(seed.workout.name.length).toBeLessThanOrEqual(LIMITS.workoutNameChars)
      expect(seed.workout.rounds.length).toBeGreaterThanOrEqual(LIMITS.rounds.min)
      expect(seed.workout.rounds.length).toBeLessThanOrEqual(LIMITS.rounds.max)

      for (const round of seed.workout.rounds) {
        expect(round.exercise.length).toBeLessThanOrEqual(LIMITS.exerciseNameChars)
        const bounds = round.mode === 'time' ? LIMITS.workTime : LIMITS.reps
        expect(round.value).toBeGreaterThanOrEqual(bounds.min)
        expect(round.value).toBeLessThanOrEqual(bounds.max)
        expect(round.restTime).toBeGreaterThanOrEqual(LIMITS.restTime.min)
        expect(round.restTime).toBeLessThanOrEqual(LIMITS.restTime.max)
      }
    }
  })
})

describe('ten-minute-hiit-v1', () => {
  const seed = seedById('ten-minute-hiit-v1')

  it('is named after its length', () => {
    expect(seed.workout.name).toBe('10-Minute HIIT')
  })

  it('leads in with a 10s prepare delay', () => {
    expect(seed.workout.prepareDelay).toBe(true)
    expect(seed.workout.prepareSeconds).toBe(10)
  })

  it('lists the ten exercises in order', () => {
    expect(seed.workout.rounds.map(round => round.exercise)).toEqual([
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
    ])
  })

  it('runs every round for 40s of work and 20s of rest', () => {
    expect(seed.workout.rounds).toHaveLength(10)
    for (const round of seed.workout.rounds) {
      expect(round.mode).toBe('time')
      expect(round.value).toBe(40)
      expect(round.restTime).toBe(20)
    }
  })

  it('works and rests for exactly 600s', () => {
    const total = seed.workout.rounds.reduce(
      (sum, round) => sum + roundWorkSeconds(round) + round.restTime,
      0,
    )
    expect(total).toBe(600)
  })

  // The card total includes the prepare delay, so it reads 10:10 rather than
  // 10:00. Pinned so a change to the lead-in is a visible failure.
  it('shows 610s on the card', () => {
    expect(estimateWorkoutSeconds(seed.workout)).toBe(610)
  })
})
