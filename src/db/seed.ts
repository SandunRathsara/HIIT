// Both imports are type-only, so this module has no runtime dependencies and
// no import cycle with db.ts.
import type { HiitDb } from './db'
import type { WorkoutSeed } from './seeds'

/**
 * Inserts every seed whose id is not yet recorded in `appliedSeeds`, and
 * returns the ids applied.
 *
 * A seed is delivered exactly once per database. The marker is what makes it
 * idempotent, so deleting the resulting workout does not bring it back.
 *
 * Insert and marker share one transaction: a failure rolls back both and the
 * next run retries from a clean slate.
 *
 * Deliberately not an `async function`. `db.transaction()` must be called
 * before the first await so it is created synchronously in the caller's zone.
 * `db.on('ready')` fires inside a Dexie VIP zone, and a transaction opened
 * there may run while the database is still opening; one opened after an
 * await would queue behind open() and deadlock.
 */
export function applySeeds(
  db: HiitDb,
  seeds: WorkoutSeed[],
  now: number,
): Promise<string[]> {
  return db.transaction('rw', db.workouts, db.appliedSeeds, async () => {
    const applied = new Set(await db.appliedSeeds.toCollection().primaryKeys())
    const pending = seeds.filter(seed => !applied.has(seed.id))

    for (const seed of pending) {
      await db.workouts.add({
        ...seed.workout,
        createdAt: now,
        lastUsedAt: null,
      })
      await db.appliedSeeds.add({ id: seed.id, appliedAt: now })
    }

    return pending.map(seed => seed.id)
  })
}
