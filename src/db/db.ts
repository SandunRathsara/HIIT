import Dexie, { type EntityTable, type Table } from 'dexie'
import type { AppliedSeed, Workout } from './schema'

export type HiitDb = Dexie & {
  workouts: EntityTable<Workout, 'id'>
  // A plain Table rather than an EntityTable: `id` is authored by the seed,
  // not generated, so it must be supplied on add().
  appliedSeeds: Table<AppliedSeed, string>
}

export const db = new Dexie('HiitDB') as HiitDb

// Only fields used for lookup need to be indexed. `rounds` is a plain
// embedded array — it is never queried on its own.
db.version(1).stores({
  workouts: '++id, lastUsedAt, createdAt',
})

// Purely additive. Dexie treats each version as a diff, so `workouts` carries
// over untouched from v1, and the v1 declaration stays so databases created
// before this change upgrade in place.
db.version(2).stores({
  appliedSeeds: 'id',
})
