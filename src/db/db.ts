import Dexie, { type EntityTable, type Table } from 'dexie'
import type { AppliedSeed, Workout } from './schema'
import { applySeeds } from './seed'
import { WORKOUT_SEEDS } from './seeds'

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

// `ready` rather than `populate`: populate only fires when the database is
// first created, so installs that already exist would never receive a new
// built-in workout.
//
// Dexie holds every queued query until this promise settles, so the workout
// list cannot render a pre-seed state and then pop a card in.
//
// `vipDb` is Dexie's VIP proxy for the still-opening database. Using the
// module-level `db` here would hit the not-yet-open guard, which is why
// applySeeds takes the database as a parameter.
//
// The catch is load-bearing: a rejected `ready` handler fails db.open(),
// leaving the app with a database it can never open and a list that never
// loads. A broken seed should cost the seeded workout, not the app.
db.on('ready', vipDb =>
  applySeeds(vipDb as HiitDb, WORKOUT_SEEDS, Date.now()).catch((error: unknown) => {
    console.error('Workout seeding failed', error)
  }),
)
