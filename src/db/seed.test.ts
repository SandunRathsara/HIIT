// Must come before anything that imports `db`.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { applySeeds } from './seed'
import { WORKOUT_SEEDS, type WorkoutSeed } from './seeds'

function fakeSeed(id: string, name: string): WorkoutSeed {
  return {
    id,
    workout: {
      name,
      prepareDelay: true,
      prepareSeconds: 10,
      rounds: [
        {
          order: 1,
          exercise: 'Burpees',
          mode: 'time',
          value: 40,
          secondsPerRep: 3,
          restTime: 20,
        },
      ],
    },
  }
}

const first = fakeSeed('first-v1', 'First')
const second = fakeSeed('second-v1', 'Second')

async function names(): Promise<string[]> {
  return (await db.workouts.toArray()).map(workout => workout.name)
}

describe('applySeeds', () => {
  beforeEach(async () => {
    await db.workouts.clear()
    await db.appliedSeeds.clear()
  })

  it('inserts a pending seed and returns its id', async () => {
    expect(await applySeeds(db, [first], 1_000)).toEqual(['first-v1'])
    expect(await names()).toEqual(['First'])
  })

  it('stamps createdAt from `now` and leaves lastUsedAt null', async () => {
    await applySeeds(db, [first], 7_000)
    const [saved] = await db.workouts.toArray()

    expect(saved.createdAt).toBe(7_000)
    expect(saved.lastUsedAt).toBeNull()
    expect(saved.rounds).toHaveLength(1)
  })

  it('records a marker for each seed it applies', async () => {
    await applySeeds(db, [first], 1_000)

    expect(await db.appliedSeeds.get('first-v1')).toEqual({
      id: 'first-v1',
      appliedAt: 1_000,
    })
  })

  it('is a no-op on a second run', async () => {
    await applySeeds(db, [first], 1_000)

    expect(await applySeeds(db, [first], 2_000)).toEqual([])
    expect(await db.workouts.count()).toBe(1)
  })

  // The requirement: delivered once, then it is an ordinary workout.
  it('does not bring back a seeded workout that was deleted', async () => {
    await applySeeds(db, [first], 1_000)
    await db.workouts.clear()

    expect(await applySeeds(db, [first], 2_000)).toEqual([])
    expect(await db.workouts.count()).toBe(0)
  })

  it('applies only the seeds that are new', async () => {
    await applySeeds(db, [first], 1_000)

    expect(await applySeeds(db, [first, second], 2_000)).toEqual(['second-v1'])
    expect(await names()).toEqual(['First', 'Second'])
  })

  it('leaves unrelated workouts alone', async () => {
    await db.workouts.add({
      name: 'Mine',
      prepareDelay: false,
      prepareSeconds: 5,
      rounds: [],
      createdAt: 1,
      lastUsedAt: null,
    })

    await applySeeds(db, [first], 1_000)

    expect((await names()).sort()).toEqual(['First', 'Mine'])
  })

  // Two seeds sharing an id make the second marker insert collide, aborting
  // the transaction. Nothing should survive, so the next run retries clean.
  it('rolls back both the workout and the marker when the transaction fails', async () => {
    await expect(applySeeds(db, [first, fakeSeed('first-v1', 'Clash')], 1_000)).rejects.toThrow()

    expect(await db.workouts.count()).toBe(0)
    expect(await db.appliedSeeds.count()).toBe(0)
  })

  it('delivers every real seed', async () => {
    const applied = await applySeeds(db, WORKOUT_SEEDS, 1_000)

    expect(applied).toEqual(WORKOUT_SEEDS.map(seed => seed.id))
    expect(await names()).toEqual(WORKOUT_SEEDS.map(seed => seed.workout.name))
  })
})
