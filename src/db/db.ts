import Dexie, { type EntityTable } from 'dexie'
import type { Workout } from './schema'

export const db = new Dexie('HiitDB') as Dexie & {
  workouts: EntityTable<Workout, 'id'>
}

// Only fields used for lookup need to be indexed. `rounds` is a plain
// embedded array — it is never queried on its own.
db.version(1).stores({
  workouts: '++id, lastUsedAt, createdAt',
})
