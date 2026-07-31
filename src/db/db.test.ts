// Must come before anything that imports `db`.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'

describe('db schema', () => {
  beforeEach(async () => {
    await db.appliedSeeds.clear()
  })

  it('is at version 2', async () => {
    await db.open()
    expect(db.verno).toBe(2)
  })

  it('stores a marker under its string id', async () => {
    await db.appliedSeeds.add({ id: 'test-seed', appliedAt: 1_000 })

    expect(await db.appliedSeeds.get('test-seed')).toEqual({
      id: 'test-seed',
      appliedAt: 1_000,
    })
  })

  // applySeeds relies on this to roll back a malformed seed registry.
  it('rejects a duplicate marker id', async () => {
    await db.appliedSeeds.add({ id: 'dupe', appliedAt: 1_000 })

    await expect(db.appliedSeeds.add({ id: 'dupe', appliedAt: 2_000 })).rejects.toThrow()
  })

  it('leaves the workouts table intact', async () => {
    await db.open()
    expect(db.tables.map(table => table.name).sort()).toEqual(['appliedSeeds', 'workouts'])
  })
})
