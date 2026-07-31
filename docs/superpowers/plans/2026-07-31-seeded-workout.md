# Seeded Workout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a built-in "10-Minute HIIT" workout that is inserted into every install exactly once, then behaves like any user-created workout.

**Architecture:** Seed content lives as plain data in `src/db/seeds.ts`. A dependency-free `applySeeds(db, seeds, now)` in `src/db/seed.ts` inserts any seed whose id is not yet recorded in a new `appliedSeeds` table, insert and marker sharing one transaction. `db.on('ready')` runs it at startup, which makes Dexie hold every queued query until seeding finishes so the workout list never renders a pre-seed state.

**Tech Stack:** TypeScript 5.9, Dexie 4.4.4 (IndexedDB), Vitest 4, fake-indexeddb 6, pnpm.

**Spec:** `docs/superpowers/specs/2026-07-31-seeded-workout-design.md`

## Global Constraints

- Package manager is **pnpm**. Never `npm` or `yarn`. Prefix any `npx` with `rtk proxy`.
- Run tests one-shot with `pnpm test --run <path>`. Bare `pnpm test` starts watch mode and will hang.
- **Match the code style of `src/db/*.ts`: single quotes, no semicolons, 2-space indent, arrow params unparenthesised when single (`seed => ...`).** The repo's `.prettierrc` says `singleQuote: false`, but no file in `src/db/` follows it. **Do not run `pnpm format`** — it would rewrite unrelated files.
- Baseline before starting: `pnpm test --run` gives **10 files, 96 tests, all passing**. Every task must leave it green.
- Never widen `Round` or `Workout`. This feature adds one new interface (`AppliedSeed`) and changes no existing one.
- Every test file that touches IndexedDB must have `import 'fake-indexeddb/auto'` as its **first** line, before anything that imports `db`. See `src/db/workoutRepo.test.ts:1`.
- Seed ids are permanent. Changing `ten-minute-hiit-v1` would re-deliver the workout to every existing install.

---

### Task 1: Seed content

Pure data plus its assertions. No database, no I/O. This task is what a future edit to the workout will break, so the tests pin the numbers hard.

**Files:**
- Create: `src/db/seeds.ts`
- Test: `src/db/seeds.test.ts`

**Interfaces:**
- Consumes: `Round`, `LIMITS`, `DEFAULT_ROUND`, `DEFAULT_PREPARE_SECONDS` from `./schema`; `NewWorkout` from `./workoutRepo`; `roundWorkSeconds`, `estimateWorkoutSeconds` from `@/lib/duration`
- Produces:
  - `interface WorkoutSeed { id: string; workout: NewWorkout }`
  - `const WORKOUT_SEEDS: WorkoutSeed[]` — currently one entry, id `ten-minute-hiit-v1`

- [ ] **Step 1: Write the failing test**

Create `src/db/seeds.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test --run src/db/seeds.test.ts
```

Expected: FAIL — `Failed to resolve import "./seeds"`.

- [ ] **Step 3: Write the seed data**

Create `src/db/seeds.ts`:

```ts
import { DEFAULT_PREPARE_SECONDS, DEFAULT_ROUND, type Round } from './schema'
// Type-only: erased at build time, so this does not create a runtime import
// of workoutRepo (which imports the live `db`).
import type { NewWorkout } from './workoutRepo'

/** A built-in workout shipped with the app. */
export interface WorkoutSeed {
  /**
   * Stable and never reused. Recorded in `appliedSeeds` once delivered, so
   * changing it would re-deliver the workout to every existing install.
   */
  id: string
  workout: NewWorkout
}

const TEN_MINUTE_EXERCISES = [
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
]

/** Every round of the 10-minute routine is 40s of work then 20s of rest. */
function timedRound(exercise: string, index: number): Round {
  return {
    order: index + 1,
    exercise,
    mode: 'time',
    value: 40,
    // Ignored in time mode, but Round requires a value.
    secondsPerRep: DEFAULT_ROUND.secondsPerRep,
    restTime: 20,
  }
}

export const WORKOUT_SEEDS: WorkoutSeed[] = [
  {
    id: 'ten-minute-hiit-v1',
    workout: {
      name: '10-Minute HIIT',
      prepareDelay: true,
      prepareSeconds: DEFAULT_PREPARE_SECONDS,
      // Round 10 keeps its 20s rest, which the schema treats as the cool
      // down — that is what makes work plus rest land on exactly 600s.
      rounds: TEN_MINUTE_EXERCISES.map(timedRound),
    },
  },
]
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test --run src/db/seeds.test.ts
```

Expected: PASS — 9 tests.

- [ ] **Step 5: Typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: both clean, no output beyond the script echo.

- [ ] **Step 6: Commit**

```bash
git add src/db/seeds.ts src/db/seeds.test.ts
git commit -m "feat: add the 10-minute HIIT workout as seed data"
```

---

### Task 2: `appliedSeeds` table (schema v2)

Storage for the "already delivered" marker. No seeding logic yet — this task only proves the table exists and enforces unique ids, which Task 3's rollback test depends on.

**Files:**
- Modify: `src/db/schema.ts` (append the new interface)
- Modify: `src/db/db.ts:1-12` (whole file)
- Test: `src/db/db.test.ts`

**Interfaces:**
- Consumes: `Workout` from `./schema`
- Produces:
  - `interface AppliedSeed { id: string; appliedAt: number }` in `./schema`
  - `type HiitDb` exported from `./db` — the augmented Dexie type, so `seed.ts` can take the database as a parameter
  - `db.appliedSeeds` typed `Table<AppliedSeed, string>`

- [ ] **Step 1: Write the failing test**

Create `src/db/db.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test --run src/db/db.test.ts
```

Expected: FAIL — TypeScript reports `Property 'appliedSeeds' does not exist`, and at runtime `db.appliedSeeds` is undefined.

- [ ] **Step 3: Add the `AppliedSeed` interface**

Append to `src/db/schema.ts`, after the `Workout` interface (before `LIMITS`):

```ts
/** Records that a built-in workout has already been delivered to this database. */
export interface AppliedSeed {
  /** Matches `WorkoutSeed.id`. */
  id: string
  appliedAt: number
}
```

- [ ] **Step 4: Add the table**

Replace the whole of `src/db/db.ts` with:

```ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
pnpm test --run src/db/db.test.ts
```

Expected: PASS — 4 tests.

- [ ] **Step 6: Confirm the existing suite is untouched**

```bash
pnpm test --run && pnpm typecheck && pnpm lint
```

Expected: 12 files, 109 tests, all passing (96 baseline + 9 from Task 1 + 4 from this task). Lint and typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add src/db/schema.ts src/db/db.ts src/db/db.test.ts
git commit -m "feat: add appliedSeeds table for tracking delivered seeds"
```

---

### Task 3: `applySeeds`

The delivery function. Idempotent, transactional, and takes the database as a parameter so it can be tested directly and handed the VIP instance in Task 4.

**Files:**
- Create: `src/db/seed.ts`
- Test: `src/db/seed.test.ts`

**Interfaces:**
- Consumes: `HiitDb` (type) from `./db`; `WorkoutSeed` (type) from `./seeds`
- Produces: `applySeeds(db: HiitDb, seeds: WorkoutSeed[], now: number): Promise<string[]>` — returns the ids applied by this call

- [ ] **Step 1: Write the failing test**

Create `src/db/seed.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test --run src/db/seed.test.ts
```

Expected: FAIL — `Failed to resolve import "./seed"`.

- [ ] **Step 3: Write the implementation**

Create `src/db/seed.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test --run src/db/seed.test.ts
```

Expected: PASS — 9 tests.

If the rollback test fails because the promise resolved instead of rejecting, check that the collision is on `appliedSeeds.add` and not silently upserted — `add` must be used, never `put`.

- [ ] **Step 5: Full suite, typecheck, lint**

```bash
pnpm test --run && pnpm typecheck && pnpm lint
```

Expected: 13 files, 118 tests, all passing.

- [ ] **Step 6: Commit**

```bash
git add src/db/seed.ts src/db/seed.test.ts
git commit -m "feat: apply pending workout seeds idempotently in one transaction"
```

---

### Task 4: Run the seed at startup

Wires `applySeeds` into `db.on('ready')`. This is the only task with a manual verification step, because the wiring itself is deliberately not unit-tested — see the spec's *Not tested* section.

**Files:**
- Modify: `src/db/db.ts` (add imports at top, hook at bottom)

**Interfaces:**
- Consumes: `applySeeds` from `./seed`, `WORKOUT_SEEDS` from `./seeds`
- Produces: nothing importable — a module-load side effect

- [ ] **Step 1: Add the hook**

Append to the bottom of `src/db/db.ts`, and add the two imports below the existing ones at the top:

```ts
import { applySeeds } from './seed'
import { WORKOUT_SEEDS } from './seeds'
```

```ts
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
```

- [ ] **Step 2: Confirm the existing suite still passes**

The hook now fires in every test that imports `db` — `workoutRepo.test.ts`, `db.test.ts`, `seed.test.ts`. Dexie queues each file's `beforeEach` clear behind the seed promise, so the seeded workout is inserted and then wiped before any test body runs. All three should stay green. This step verifies that assumption rather than asserting it.

```bash
pnpm test --run
```

Expected: 13 files, 118 tests, all passing.

If a test now fails on a count or ordering assertion, the seeded workout is surviving into a test body, which means the queueing assumption is wrong. Fix it by forcing the open to settle first — add `beforeAll(async () => { await db.open() })` to the affected file, above its existing `beforeEach`. Do not weaken the assertion, and do not clear `appliedSeeds` to work around it: the marker is what stops a re-seed.

- [ ] **Step 3: Typecheck, lint, build**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all three clean.

- [ ] **Step 4: Manual verification**

```bash
pnpm dev
```

Open `http://localhost:5001` and confirm, in order:

1. A `10-Minute HIIT` card appears in the list, reading **10:10** (600s of work and rest plus the 10s prepare delay).
2. The card's work/rest labels read `40s` and `20s`.
3. Opening it shows ten rounds on the pre-start screen, starting at Jumping Jacks and ending at Bicycles.
4. Starting it shows the exercise name inside the timer ring.
5. Reload the page — exactly one `10-Minute HIIT` card, not two.
6. Swipe the card left, delete it, confirm. Reload. **It stays gone.**
7. Create a workout via the `+` button, reload, and confirm the new workout is intact and the seed is still absent.

To re-test from scratch: DevTools → Application → Storage → IndexedDB → delete `HiitDB`, then reload.

- [ ] **Step 5: Commit**

```bash
git add src/db/db.ts
git commit -m "feat: seed built-in workouts once per database on startup"
```

---

## Follow-up (not part of this plan)

`docs/CURRENT_STATE.md` is stale — it still describes the pre-Dexie localStorage timer and none of the saved-workouts work. Regenerate it via the `/current-state` command after this lands. Do not edit it inline.
