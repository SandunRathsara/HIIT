import { db } from './db'
import type { Workout } from './schema'

/** A workout as it comes out of the create form — no id, no timestamps. */
export type NewWorkout = Omit<Workout, 'id' | 'createdAt' | 'lastUsedAt'>

/**
 * Newest-activity-first. A workout that has never been run sorts by when it
 * was created, so a just-saved workout appears at the top of the list.
 */
export function sortByRecency(workouts: Workout[]): Workout[] {
  return [...workouts].sort(
    (a, b) => (b.lastUsedAt ?? b.createdAt) - (a.lastUsedAt ?? a.createdAt),
  )
}

export async function listWorkouts(): Promise<Workout[]> {
  return sortByRecency(await db.workouts.toArray())
}

export async function getWorkout(id: number): Promise<Workout | undefined> {
  return db.workouts.get(id)
}

/** `now` is injected rather than read from Date.now() so tests stay deterministic. */
export async function createWorkout(input: NewWorkout, now: number): Promise<number> {
  return db.workouts.add({
    ...input,
    rounds: input.rounds.map((round, i) => ({ ...round, order: i + 1 })),
    createdAt: now,
    lastUsedAt: null,
  })
}

export async function markUsed(id: number, now: number): Promise<void> {
  await db.workouts.update(id, { lastUsedAt: now })
}

export async function deleteWorkout(id: number): Promise<void> {
  await db.workouts.delete(id)
}
