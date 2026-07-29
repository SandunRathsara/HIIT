// Must come before anything that imports `db`.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import {
  listWorkouts,
  getWorkout,
  createWorkout,
  markUsed,
  deleteWorkout,
  sortByRecency,
  type NewWorkout,
} from './workoutRepo'
import type { Workout } from './schema'

function draft(name: string): NewWorkout {
  return {
    name,
    prepareDelay: true,
    prepareSeconds: 10,
    rounds: [
      { order: 1, exercise: 'Burpees', mode: 'time', value: 40, secondsPerRep: 3, restTime: 20 },
      { order: 2, exercise: 'Push-ups', mode: 'reps', value: 15, secondsPerRep: 3, restTime: 60 },
    ],
  }
}

describe('workoutRepo', () => {
  beforeEach(async () => {
    await db.workouts.clear()
  })

  it('creates a workout with createdAt set and lastUsedAt null', async () => {
    const id = await createWorkout(draft('Morning Burn'), 1_000)
    const saved = await getWorkout(id)

    expect(saved?.name).toBe('Morning Burn')
    expect(saved?.createdAt).toBe(1_000)
    expect(saved?.lastUsedAt).toBeNull()
    expect(saved?.rounds).toHaveLength(2)
  })

  it('renumbers round order from array position on create', async () => {
    const input = draft('Scrambled')
    input.rounds[0].order = 99
    input.rounds[1].order = 4

    const id = await createWorkout(input, 1_000)
    const saved = await getWorkout(id)

    expect(saved?.rounds.map(r => r.order)).toEqual([1, 2])
  })

  it('markUsed stamps lastUsedAt', async () => {
    const id = await createWorkout(draft('Leg Day'), 1_000)
    await markUsed(id, 5_000)

    expect((await getWorkout(id))?.lastUsedAt).toBe(5_000)
  })

  it('deleteWorkout removes it', async () => {
    const id = await createWorkout(draft('Gone'), 1_000)
    await deleteWorkout(id)

    expect(await getWorkout(id)).toBeUndefined()
    expect(await listWorkouts()).toHaveLength(0)
  })

  it('getWorkout returns undefined for an unknown id', async () => {
    expect(await getWorkout(4242)).toBeUndefined()
  })

  it('sorts used workouts by lastUsedAt descending', async () => {
    const a = await createWorkout(draft('A'), 1_000)
    const b = await createWorkout(draft('B'), 2_000)
    await markUsed(a, 9_000)
    await markUsed(b, 3_000)

    expect((await listWorkouts()).map(w => w.name)).toEqual(['A', 'B'])
  })

  it('falls back to createdAt for never-used workouts so a new one lands on top', async () => {
    const old = await createWorkout(draft('Old'), 1_000)
    await markUsed(old, 5_000)
    await createWorkout(draft('Brand New'), 8_000)

    expect((await listWorkouts()).map(w => w.name)).toEqual(['Brand New', 'Old'])
  })

  it('sortByRecency does not mutate its argument', () => {
    const input = [
      { id: 1, createdAt: 1, lastUsedAt: null },
      { id: 2, createdAt: 2, lastUsedAt: null },
    ] as Workout[]

    sortByRecency(input)

    expect(input.map(w => w.id)).toEqual([1, 2])
  })
})
