# DOMAIN

Answers: why does this system exist? Populated and kept current by `/refresh-repo-map`. Do not hand-edit outside that workflow.

## Problem and Outcomes

A person doing HIIT needs a hands-free interval timer with voice cues, a pre-start plan view, and per-exercise rounds — without accounts, a backend, or setup.

- Fresh install is immediately useful: built-in "10-Minute HIIT" workout delivered on first load (`src/db/db.ts#db` ready handler → `src/db/seed.ts#applySeeds`).
- Custom workouts created with a round editor, with live duration estimate while editing (`src/screens/CreateWorkoutScreen.tsx#CreateWorkoutScreen`).
- Pre-start summary (duration, work/rest ranges, first exercise) before committing (`src/components/PreStartPanel.tsx#PreStartPanel`).
- Phases run hands-free with speech cues; screen stays awake mid-run (`src/hooks/useWakeLock.ts#useWakeLock`); completion panel shows elapsed total with "Do it again" (`src/components/CompletePanel.tsx#CompletePanel`).
- Workout list shows recency ("New" / "3m ago") via `lastUsedAt` (`src/lib/relativeTime.ts#formatRelative`, `src/db/workoutRepo.ts#sortByRecency`).

## Actors

- Person working out — the single human actor; all UI (create, run, delete workouts) is for them.
- Seed mechanism — automated, code-level: `applySeeds` runs at every DB open via sticky `db.on('ready', …, true)` handler; seed content is authored data in `src/db/seeds.ts#WORKOUT_SEEDS`, delivered once per database, then becomes an ordinary user-deletable workout.
- No backend, no accounts, no external systems at runtime (only Google Fonts via CSS import, runtime-cached for offline, `vite.config.ts` workbox).

## Use Cases

- List workouts — `src/screens/WorkoutListScreen.tsx#WorkoutListScreen` via `useLiveQuery(listWorkouts)`; `WorkoutCard` shows name, rounds, estimate, relative last-used.
- Create workout (name, prepare delay, rounds) — `CreateWorkoutScreen`; save via `createWorkout(input, now)`; new rounds inherit previous round's shape (`newDraft`).
- Configure a round (time/reps, work value, reps pace, rest) — `src/components/RoundCard.tsx#RoundCard`; mode toggle, presets, steppers; mode switch resets value into the other unit's range.
- Delete workout (swipe + confirm) — `src/components/SwipeToDelete.tsx#SwipeToDelete`, `src/components/ConfirmSheet.tsx#ConfirmSheet`, `deleteWorkout`. A deleted seeded workout never returns.
- Start workout — stamps `lastUsedAt` (`markUsed`) then timer starts (`src/components/WorkoutRunner.tsx#WorkoutRunner` `handleStart`).
- Pre-start review — `PreStartPanel`: `~estimateWorkoutSeconds`, work/rest range labels, prep seconds or "Off", "Up first".
- Run phases (prep → work → rest → cooldown → done) — `src/hooks/useWorkoutTimer.ts#useWorkoutTimer`.
- Pause / resume / reset — `useWorkoutTimer` `pause`/`start`/`reset`; buttons in `src/components/ControlButtons.tsx#ControlButtons` (DONE replaces PAUSE on reps rounds).
- Complete reps round manually — `completeReps`; reps rounds are untimed, count elapsed up.
- Quit mid-workout with confirmation — `useBlocker` covers header back arrow + Android hardware back; quit sheet resets timer then proceeds.
- Voice cues — Web Speech API (`src/lib/cues.ts#speak`); 3-2-1 countdown on timed phases, phase-entry cues.
- Screen wake lock while running — `useWakeLock(isActive && timer.isRunning)`; re-acquired on `visibilitychange`.
- "Do it again" / back to list after completion — `CompletePanel`.
- Seed delivery (automated) — `src/db/db.ts#db` ready handler, `src/db/seed.ts#applySeeds`.

## Workflows

- **Workout creation:** `/` list → FAB `+` → `/new` → name + prepare delay toggle + preset chips → add/edit/remove rounds → live estimate → Save → back to `/` with new card on top (recency sort).
- **Run a workout:** tap card → `/workout/:id` → `WorkoutScreen` loads via `getWorkout`, remounts runner per workout id (`key={workout.id}`) → `PreStartPanel` summary → Start (stamps `lastUsedAt`) → `prep` (if prepare delay) → `work` (timed countdown or reps count-up) → `rest` → next round… → last round's rest becomes `cooldown` → `done` (`CompletePanel`) → "Do it again" (reset to idle) or back to list.
- **Interruptions:** pause/resume same second; reset to idle anytime; back/hardware-back blocked while a phase is active, quit sheet confirms, cancel keeps going.
- **Delete:** swipe card left → red delete button revealed → `ConfirmSheet` → `deleteWorkout`.
- **First-run bootstrap:** DB opens → `ready` handler runs `applySeeds` before any queued query, so the list never renders pre-seed then pops a card in.

## Ubiquitous Language

| Term | Meaning | Source |
|---|---|---|
| Workout | Persisted entity: `id, name, prepareDelay, prepareSeconds, rounds, createdAt, lastUsedAt` | `src/db/schema.ts#Workout` |
| Round | One element of a workout: `order, exercise, mode, value, secondsPerRep, restTime` | `src/db/schema.ts#Round` |
| `order` | 1-based position; invariant: always array index + 1 | `schema.ts`; renumbered on save `workoutRepo.ts#createWorkout` |
| `exercise` | Display name; may be empty → UI falls back to "ROUND n" | `schema.ts`; `src/lib/duration.ts#roundExerciseLabel` |
| `mode` / RoundMode | `'time'` (countdown) or `'reps'` (untimed count-up, manual DONE) | `schema.ts#RoundMode`; `useWorkoutTimer` |
| `value` | Seconds when `time`; repetition count when `reps` | `schema.ts` |
| `secondsPerRep` | Estimation pace for reps rounds only; ignored in time mode | `schema.ts`; `duration.ts#roundWorkSeconds` |
| `restTime` | Rest AFTER the round; 0 skips it; on the last round it is the cool down | `schema.ts`; `useWorkoutTimer` `leaveWork` |
| Phase | `'idle' \| 'prep' \| 'work' \| 'rest' \| 'cooldown' \| 'done'` | `src/hooks/useWorkoutTimer.ts#Phase` |
| Prepare delay / `prepareDelay` + `prepareSeconds` | Optional lead-in countdown before round 1; `PrepareSeconds = 5 \| 10 \| 15` | `schema.ts`; `CreateWorkoutScreen` |
| Prep / GET READY | Display naming of prepare phase | `src/lib/phaseView.ts#describePhase` |
| Cooldown / WALK IT OFF | Final round's rest; shown after last work phase | `phaseView.ts`; `useWorkoutTimer` `leaveWork` |
| Cue / CueEvent | Speech event: `prep, work, rest, cooldown, done, countdown` | `src/lib/cues.ts#CueEvent` |
| Seed / WorkoutSeed / `WORKOUT_SEEDS` | Built-in workout authored in code, delivered once per DB | `src/db/seeds.ts` |
| `appliedSeeds` / AppliedSeed | Marker table recording delivered seed ids (`id`, `appliedAt`) | `schema.ts#AppliedSeed` |
| NewWorkout | Workout minus `id/createdAt/lastUsedAt` — the create-form output shape | `workoutRepo.ts#NewWorkout` |
| RoundDraft | Unsaved round in the create form, with `key` for list identity | `RoundCard.tsx#RoundDraft` |
| Preset / PRESETS | Quick-choice chips: work `[30,45,60]`, rest `[10,20,30]`, reps `[10,15,20]`, prepare `[5,10,15]` | `schema.ts#PRESETS`; `src/components/form/PresetChips.tsx#PresetChips` |
| LIMITS | Enforced numeric bounds (see Domain Rules) | `schema.ts#LIMITS` |
| `lastUsedAt` | Timestamp of last workout start; `null` = never started ("New") | `schema.ts`; `relativeTime.ts` |
| `totalElapsed` | Seconds running across whole workout, excludes paused time | `useWorkoutTimer`; test |

## Domain Rules

- One workout at a time: runner is single-instance per route; navigation away is blocked while `phase !== 'idle' && !== 'done'`; timer state never leaks between workouts (keyed remount).
- Workout config is immutable after save: no edit/update path exists; create-time config is permanent.
- Numeric limits (`schema.ts#LIMITS`): work 5–300s step 5; reps 1–100 step 1; rest 0–300s step 5 (0 = skip); secondsPerRep 1–10; rounds 1–30; name ≤ 40 chars; exercise ≤ 30 chars. Seeded content must stay inside the same limits.
- `order` is contiguous 1..n: renumbered on create and authored correctly in seeds; asserted by tests.
- Round count 1–30: save disabled outside range; remove disabled at minimum; runner guards zero rounds — `start()` is a no-op.
- Rest semantics: `restTime > 0` between rounds → rest; `=== 0` → skip straight to next work; last round's rest → cooldown; last round with 0 rest → done immediately.
- Reps rounds are untimed: count up; only `completeReps` advances; DONE replaces PAUSE; `completeReps` ignored outside work.
- Total duration: `estimateWorkoutSeconds = prepareSeconds(if delay) + Σ(work + restTime)` where reps work = `value × secondsPerRep`; includes the last round's rest (cooldown) — the 10-min seed sums to 600s work+rest but displays 10:10 with prep.
- Seed invariants: delivered exactly once per DB — marker in `appliedSeeds`, insert+marker in one transaction (rollback on failure); deleting the seeded workout does not bring it back; seed ids are permanent and unique (reusing/changing one re-delivers); seeding failure is swallowed so it costs the seed, not the app; sticky subscription so seeding survives `db.close()`.
- Recency ordering: `lastUsedAt ?? createdAt` desc — never-run workouts sort by creation, so a just-saved or just-seeded workout appears first.
- Countdown cues only on timed phases: 3-2-1 spoken at `timeLeft ≤ 3`; reps rounds get no countdown.
- Paused time excluded from `totalElapsed`; completion shows only running time.
- Wake lock only while active AND running, not while paused.
- UI invariants: 44px min touch targets, dark navy/teal theme, no horizontal scroll at 375px.

## Boundaries and Non-Goals

- No backend, no accounts, no sync: all persistence is local IndexedDB via Dexie.
- No workout history logging: the only usage artifact is `lastUsedAt`; no sessions, completions, or stats tables.
- No edit screen for saved workouts (create-only).
- No "undeletable built-in": seeds become ordinary deletable workouts.
- No per-exercise coaching/descriptions; no custom time input, recommendations, or coaching copy.
- No re-seeding on delete: deleted seeded workouts stay gone.
- No audio other than speech: cues use Web Speech API only; silent no-op when unsupported.
- No timer audio alarms, no auto-reset after done, no auto-advance of reps rounds.
- No settings panel / global defaults at runtime (superseded by per-workout config).
- No multi-user/multi-device features, no export/import.
- The original May 2026 design spec (localStorage, live settings panel, auto-reset after done) is superseded by the implemented July 2026 specs (Dexie, immutable per-workout config, persistent done panel).

<!-- repo-map-synced: ab417c09eeaab2a3f791a6083d52bad0481cf1d0 -->
