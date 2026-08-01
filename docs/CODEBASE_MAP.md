# CODEBASE_MAP

Answers: where is today's shipped implementation? Organized by capability and concern, not directory order. Populated and kept current by `/refresh-repo-map`. Do not hand-edit outside that workflow.

## Executable Entry Points

- `index.html` — static shell: `#root` div, loads `/src/main.tsx`; PWA meta (theme-color `#0d1b2a`, `viewport-fit=cover`, apple metas).
- `src/main.tsx` — `createRoot(...).render(<StrictMode><App /></StrictMode>)`; imports `./index.css` first. StrictMode double-invokes effects/updaters in dev — relevant to cue-deferral design.
- `src/App.tsx#App` — `createHashRouter` data router (chosen over `<HashRouter>` so `useBlocker` works). Routes: `/` → `WorkoutListScreen`, `/new` → `CreateWorkoutScreen`, `/workout/:id` → `WorkoutScreen`, `*` → `<Navigate to="/" replace />`.
- `vite.config.ts` — plugins: `@tailwindcss/vite`, `@vitejs/plugin-react`, `VitePWA` (`autoUpdate`, manifest, workbox globPatterns + Google Fonts CacheFirst); dev server `host: true`, port `5001`; alias `@` → `./src`; Vitest: jsdom, globals, `setupFiles: ['./src/test/setup.ts']`, `passWithNoTests`.
- `pwa-assets.config.ts` — `@vite-pwa/assets-generator`: `minimal2023Preset` from `public/favicon.svg`.
- `src/index.css` — Tailwind v4 entry: Google Fonts import, `@import "tailwindcss"`, `@theme` tokens (fonts, shadcn tokens mapped to teal/slate), utilities `.countdown-pulse`, `.ring-breathe`, `.screen-fixed`, `.screen-scroll`, `prefers-reduced-motion` kill-switch.

## Capabilities and Concerns

**Workout library (list + selection)**
- `src/screens/WorkoutListScreen.tsx#WorkoutListScreen` — `useLiveQuery(listWorkouts)`, skeleton while `undefined`, `EmptyState` when empty, per-render `Date.now()` stamp (`#CardSkeleton`).
- `src/components/WorkoutCard.tsx#WorkoutCard` — name, rounds count, `~estimate`, relative last-used, tap → `/workout/:id`.
- `src/components/EmptyState.tsx#EmptyState` — "No workouts yet".
- `src/db/workoutRepo.ts#listWorkouts`, `#sortByRecency` — newest-activity-first, `lastUsedAt ?? createdAt` fallback.
- `src/lib/relativeTime.ts#formatRelative` — "New"/"Just now"/"Xm ago"/"Xh ago"/"Yesterday"/days/weeks/months; `now` injected for testability.

**Round editor (create form)**
- `src/screens/CreateWorkoutScreen.tsx#CreateWorkoutScreen` — name + validation, prepare-delay `Switch`, live duration estimate, round list, save; `#newDraft` (inherits previous round shape; module-level `nextKey`), `#addRound` (scrolls to end), `#save` (calls `createWorkout(..., Date.now())`, navigates `/` replace).
- `src/components/RoundCard.tsx#RoundCard` — Work/Rest sections, mode `SegmentedToggle`, presets + steppers, Pace row in reps mode, per-round estimate; `#RoundDraft` interface; `#setMode` moves value into the other unit's preset.
- Form primitives: `src/components/form/TextField.tsx#TextField` (char counter, error/aria wiring), `src/components/form/PresetChips.tsx#PresetChips` (equal-width flex-1 chips), `src/components/form/StepperRow.tsx#StepperRow` (clamped ±step, `aria-live="polite"`), `src/components/form/SegmentedToggle.tsx#SegmentedToggle` (generic `<T extends string>`).
- Limits/defaults source of truth: `src/db/schema.ts#LIMITS`, `#PRESETS`, `#DEFAULT_ROUND`, `#DEFAULT_PREPARE_SECONDS`.

**Seeded workouts**
- `src/db/seeds.ts#WORKOUT_SEEDS` — `ten-minute-hiit-v1` (10 exercises × 40s work / 20s rest, prep 10s); `#WorkoutSeed` (stable, never-reused `id`); `#timedRound` builder.
- Delivery: `src/db/db.ts#db` `db.on('ready', handler, true)` sticky handler → `src/db/seed.ts#applySeeds`.

**Running timer state machine (phases idle/prep/work/rest/cooldown/done)**
- `src/hooks/useWorkoutTimer.ts#useWorkoutTimer` — owns ALL timer state (`TimerState` internal: phase, roundIndex, timeLeft, elapsed, totalElapsed, isRunning; `#IDLE` const). Exports `#start`, `#pause`, `#completeReps`, `#reset`, derived `currentRound`/`nextRound`/`isRepsRound`/`phaseTotal`, types `#Phase`, `#WorkoutTimer`.
- Pure transition helpers: `#enterWork`, `#leaveWork` (last round → cooldown (rest>0) or done; rest>0 → rest; else straight to next work), `#advance` (interval-driven zero-crossing).
- `#startInterval` — 1s `setInterval`, reads `stateRef`/`workoutRef` (stale-closure avoidance via `useLayoutEffect` sync), countdown cues at 3/2/1 (`#cueNow`), reps rounds count up only; `#stopInterval` on done. Cleanup on unmount.
- Reps rounds are untimed: tick increments `elapsed`; advance only via `completeReps`.

**Speech cues**
- `src/lib/cues.ts#buildCue` (CueEvent → phrase; fallbacks for blank exercise names, singular "1 rep"), `#speak` (`window.speechSynthesis.cancel()` then `speak(new SpeechSynthesisUtterance(text))`; no-op where API missing), `#CueEvent` union.
- Deferral discipline in `useWorkoutTimer`: `#cue` (setTimeout — StrictMode-safe inside setState updaters) vs `#cueNow` (synchronous — required because a zero-length timer tick may be the last flushable moment).

**Wake lock**
- `src/hooks/useWakeLock.ts#useWakeLock` — `navigator.wakeLock.request('screen')` while active, sentinel ref, re-acquire on `visibilitychange`, silent no-op where API missing. Enabled in `WorkoutRunner` as `useWakeLock(isActive && timer.isRunning)`.

**Progress display**
- `src/components/TimerDisplay.tsx#TimerDisplay` — ring via `src/components/ui/circular-progress.tsx` (`#CircularProgress` family; container-query sizing), per-phase `#RING_COLOR`/`#PHASE_TEXT_COLOR`, countdown-pulse at ≤3s, reps target + count-up elapsed, round dots.
- `src/components/ProgressBar.tsx#ProgressBar` — thin bar, `data-testid="progress-fill"`, `#FILL_COLOR` map.
- `src/components/PreStartPanel.tsx#PreStartPanel` — ~duration, Work/Rest/Prep ranges, "Up first", Start CTA; `#Stat` local.
- `src/components/CompletePanel.tsx#CompletePanel` — completion summary + "Do it again"/"Back to workouts".
- `src/lib/phaseView.ts#describePhase` + `#PhaseView` — per-phase copy (label/kicker/ringText/subline/showsClock) consumed by TimerDisplay.
- `src/lib/duration.ts` — `#roundWorkSeconds`, `#estimateWorkoutSeconds`, `#formatClock`, `#formatCountdown`, `#rangeLabel`, `#workRangeLabel`, `#restRangeLabel`, `#roundTargetLabel`, `#roundExerciseLabel`.

**Swipe-to-delete**
- `src/components/SwipeToDelete.tsx#SwipeToDelete` — pointer-event based, `REVEAL_PX = 88`, `AXIS_LOCK_PX = 10` axis-lock (vertical scroll preserved), snap open/closed on release, `onClickCapture` click suppression after swipe.

**Confirm sheets**
- `src/components/ConfirmSheet.tsx#ConfirmSheet` — bottom sheet dialog, autofocus confirm, Escape + backdrop click cancel, danger/default tones. Consumers: delete workout (`WorkoutListScreen`), quit workout (`WorkoutRunner` via `useBlocker`).

**Persistence layer**
- `src/db/db.ts#db` — `new Dexie('HiitDB')`; v1 `workouts: '++id, lastUsedAt, createdAt'`, v2 `appliedSeeds: 'id'` (purely additive; v1 declaration retained for in-place upgrade); `#HiitDb` type.
- `src/db/workoutRepo.ts` — `#listWorkouts`, `#getWorkout`, `#createWorkout` (renumbers `rounds[].order` from array position; `now` injected), `#markUsed`, `#deleteWorkout`, `#sortByRecency`, `#NewWorkout` type.
- Reactive reads: `useLiveQuery` from `dexie-react-hooks` in `WorkoutListScreen` and `WorkoutScreen`.

**Seed application (VIP zone)**
- `src/db/seed.ts#applySeeds` — one `rw` transaction over `workouts` + `appliedSeeds`; skips ids already marked; inserts workout + marker atomically; returns applied ids. Deliberately NOT `async function` (transaction must be created before first await inside the Dexie VIP `ready` zone, else it queues behind `open()` and deadlocks). Markers make deletion permanent.

**Theme**
- Dark-only palette driven by `src/index.css` (`@theme` tokens, `@custom-variant dark`) plus per-phase color maps: `WorkoutRunner#PHASE_BG`, `TimerDisplay#RING_COLOR`/`#PHASE_TEXT_COLOR`, `ProgressBar#FILL_COLOR`, `ControlButtons#PHASE_CTA_STYLE`.

**Routing / navigation / quit protection**
- `src/App.tsx` (hash router), `src/screens/WorkoutScreen.tsx#WorkoutScreen` (param → `getWorkout`, `?? null` loading-vs-not-found distinction, `<Navigate to="/">` on missing, remount-key `key={workout.id}`), `src/components/WorkoutRunner.tsx#WorkoutRunner` (run screen: header, phase panels, `#PHASE_BG`, `#shouldBlock` blocker fn, quit `ConfirmSheet`).

**Controls**
- `src/components/ControlButtons.tsx#ControlButtons` — START/PAUSE/RESUME/RESET + DONE-on-reps logic; `#PHASE_CTA_STYLE`.

## Critical Flows

**Boot → seed → list render**
1. `index.html` → `src/main.tsx` → `src/App.tsx` router → `WorkoutListScreen`.
2. `useLiveQuery(listWorkouts)` opens `db`; Dexie fires `ready` (VIP zone) → sticky handler → `applySeeds(vipDb, WORKOUT_SEEDS, Date.now())` — inserts `10-Minute HIIT` + marker in one transaction (catch logged, never rejects open).
3. Dexie holds queued queries until `ready` settles → first render already includes the seed (no pop-in).
4. List shows skeleton while `undefined`, `EmptyState` if zero, else `WorkoutCard`s (sorted `lastUsedAt ?? createdAt` desc).

**Start workout → state machine → cues → completion**
1. `WorkoutCard` → `/workout/:id` → `WorkoutScreen` → `WorkoutRunner` (keyed remount).
2. `PreStartPanel` Start → `handleStart`: `markUsed(id, Date.now())` (stamps recency) + `timer.start()`.
3. `start()`: from `IDLE` + running; prep phase if `prepareDelay` (deferred cue "Get ready. <name>."), else `enterWork(0)` directly. `startInterval()` begins 1s ticks via `stateRef`.
4. Ticks: countdown cues at 3-2-1 (`cueNow`); at zero `advance()`: prep→work, work→(rest | cooldown | next work | done), rest→next work, cooldown→done; `stopInterval()` on done.
5. Reps rounds: interval only increments `elapsed`; `completeReps` → `leaveWork`.
6. Pause/reset anytime via `ControlButtons`. Wake lock held while `isActive && isRunning`.
7. `done` → `CompletePanel` (`totalElapsed`) → "Do it again" (`reset`) or back to list. Quit mid-run: header back arrow or Android hardware back → `useBlocker` → `ConfirmSheet` → `timer.reset()` + `blocker.proceed()`. Blocker-reset effect (`WorkoutRunner`) clears stale blocked state when `isActive` flips.

**Round edit → repo save → list refresh**
1. `CreateWorkoutScreen` builds drafts (`newDraft` inherits previous round's shape) → `save()` → `createWorkout(input, Date.now())` (orders renumbered 1..n) → `navigate('/', { replace: true })`.
2. List re-queries via `useLiveQuery`; never-used workout sorts by `createdAt` so it lands on top.

## Shared Utilities and Infrastructure

- `cn()`: `src/lib/utils.ts#cn` (clsx + tailwind-merge).
- Schema/domain types + constants: `src/db/schema.ts` — `#RoundMode`, `#PrepareSeconds`, `#Round`, `#Workout`, `#AppliedSeed`, `#LIMITS`, `#PRESETS`, `#DEFAULT_PREPARE_SECONDS`, `#DEFAULT_ROUND`.
- DB instance: `src/db/db.ts#db` (`HiitDb` = Dexie & EntityTable/Table mix).
- Test infrastructure: `src/test/setup.ts` — jest-dom import + ResizeObserver stub (Radix UI Slider). `fake-indexeddb/auto` imported as the FIRST line of `src/db/db.test.ts`, `src/db/seed.test.ts`, `src/db/workoutRepo.test.ts` (must precede any `db` import).
- Path alias `@/*` in both `vite.config.ts` and `tsconfig.app.json` (`./src/*`).
- UI primitives: `src/components/ui/circular-progress.tsx` (used by TimerDisplay), `src/components/ui/switch.tsx` (used by CreateWorkoutScreen). Unused shadcn boilerplate: `src/components/ui/button.tsx#Button` and `src/components/ui/slider.tsx#Slider` — imported nowhere in `src`.

## Interfaces and State

- Exported types: `Phase`, `WorkoutTimer` (`src/hooks/useWorkoutTimer.ts`); `CueEvent` (`src/lib/cues.ts`); `RoundDraft` (`src/components/RoundCard.tsx`); `PhaseView`, `PhaseViewInput` (`src/lib/phaseView.ts`); `WorkoutSeed` (`src/db/seeds.ts`); `HiitDb` (`src/db/db.ts`); `NewWorkout` (`src/db/workoutRepo.ts`); `RoundMode`, `PrepareSeconds`, `Round`, `Workout`, `AppliedSeed` (`src/db/schema.ts`). `TimerState` is internal to `useWorkoutTimer`.
- Dexie tables: `workouts` (`EntityTable<Workout, 'id'>`, `++id`, indexed `lastUsedAt`, `createdAt`; `rounds` embedded, never queried); `appliedSeeds` (`Table<AppliedSeed, string>`, plain table — `id` authored by seed, not generated).
- localStorage: none — zero `localStorage`/`sessionStorage` references in `src`.
- Speech synthesis: `src/lib/cues.ts#speak` — guards `window.speechSynthesis` + `SpeechSynthesisUtterance`; cancel-then-speak. jsdom tests stub both globals.
- Wake lock: `src/hooks/useWakeLock.ts` — `navigator.wakeLock.request('screen')`, sentinel release, visibilitychange re-acquire, feature-detect guard, silent catch.
- State ownership: no global state lib; timer state lives solely in `useWorkoutTimer` (useState + refs); screens use local useState; persistence reactive via `useLiveQuery`.

## Change Hazards

- **Seed idempotency** — marker in `appliedSeeds` is the contract: changing a seed `id` re-delivers the workout to every existing install; deleting the workout does not bring it back (pinned by `src/db/seed.test.ts`).
- **`ready` handler must stay sticky + catching** — a rejected `ready` promise fails `db.open()` permanently; non-sticky unsubscribe kills seeding after Dexie-initiated `db.close()`.
- **`applySeeds` must stay a non-async function** — VIP-zone transaction creation before first await; converting to `async` deadlocks.
- **Dexie versioning** — v1 `workouts` declaration must stay; new versions are diffs; bump `version(n)` for any store change.
- **StrictMode double-invoke** — cues emitted inside `setState` updaters must use deferred `cue()` (setTimeout); synchronous `cueNow()` only safe in the interval callback.
- **Ref-synced interval** — `stateRef`/`workoutRef` sync via `useLayoutEffect`; must precede any 1s tick observing state; stale closures here silently break transitions.
- **Runner remount key** — `WorkoutScreen` passes `key={workout.id}`; timer state must never leak between workouts.
- **useBlocker quirk** — react-router never un-blocks a blocked blocker on its own; the reset effect in `WorkoutRunner` is load-bearing.
- **Workouts are immutable post-create** — there is no edit path at all; changing this requires a new screen + repo update.
- **Per-phase color/label maps must stay in sync** — adding a `Phase` value forces edits in 5 records: `WorkoutRunner#PHASE_BG`, `TimerDisplay#RING_COLOR` + `#PHASE_TEXT_COLOR`, `ProgressBar#FILL_COLOR`, `ControlButtons#PHASE_CTA_STYLE`, plus `describePhase`.
- **Test stubs required** — `ResizeObserver` (setup.ts), `speechSynthesis`/`SpeechSynthesisUtterance` (useWorkoutTimer.test), `navigator.wakeLock` defineProperty (useWakeLock.test), `fake-indexeddb/auto` before `db` import (3 db test files).
- **`PrepareSeconds` union** — adding a prep preset requires widening `src/db/schema.ts#PrepareSeconds` and `PRESETS.prepareSeconds`.
- **Pinned estimates** — card shows 610s for the seed (incl. prep); form estimate includes prep; changing prep defaults breaks pins.
- **Per-render `Date.now()`** with eslint-disable (`WorkoutListScreen`) — deliberate coarse relative labels.
- **`markUsed` on start only** — recency never updates mid-workout.
- **Swipe gesture** — axis lock must keep vertical list scroll free; click suppression after swipe is required to avoid accidental navigation.
- **jsdom lacks `matchMedia`/`ResizeObserver`** — any new Radix-based component (e.g. using `ui/button.tsx`, `ui/slider.tsx`) may need additional stubs.

## Verification Map

| Test file | Covers |
|---|---|
| `src/db/db.test.ts` | Dexie schema: verno 2, marker storage/get, duplicate-marker rejection, table list intact |
| `src/db/schema.test.ts` | `PRESETS` values, `DEFAULT_ROUND` value 45 / rest 20 |
| `src/db/seed.test.ts` | `applySeeds`: insert, createdAt/lastUsedAt stamping, marker record, idempotency, no-resurrection after delete, incremental application, isolation from user workouts, transaction rollback, all real seeds delivered |
| `src/db/seeds.test.ts` | Unique ids, contiguous orders, within form `LIMITS`, `ten-minute-hiit-v1` specifics (name, prep, exercise order, 40/20, exactly 600s work+rest, 610s card estimate) |
| `src/db/workoutRepo.test.ts` | Create timestamps, order renumbering, `markUsed`, `deleteWorkout`, unknown id, recency sort (used + never-used), `sortByRecency` immutability |
| `src/hooks/useWorkoutTimer.test.ts` | Full state machine: idle, prep entry/skip, prep→work, work→rest→next, rest-skip (0), cooldown→done, immediate done, no auto-reset, reps hold + count-up, `completeReps` advance/ignore, pause/resume, reset, totalElapsed accumulation, speech on transitions, 3-2-1 countdown speech, `phaseTotal`, empty rounds stay idle |
| `src/hooks/useWakeLock.test.ts` | Request on active, none when inactive, release on inactive/unmount, re-acquire on visibilitychange, late-resolving sentinel released, missing API no-throw |
| `src/lib/cues.test.ts` | `buildCue` copy for all event types + blank-name and singular-rep fallbacks |
| `src/lib/duration.test.ts` | `roundWorkSeconds` (time/reps/pace), `estimateWorkoutSeconds`, `formatClock`, `formatCountdown`, `rangeLabel`, `workRangeLabel`, `restRangeLabel`, `roundTargetLabel`, `roundExerciseLabel` |
| `src/lib/phaseView.test.ts` | `describePhase` for prep/work(timed+reps)/rest/cooldown/idle/done |
| `src/lib/relativeTime.test.ts` | All `formatRelative` buckets + future-timestamp clamp |
| `src/components/ControlButtons.test.tsx` | PAUSE/RESUME/DONE switching, callback firing, RESET always present |
| `src/components/ProgressBar.test.tsx` | Fill width at 0%/50%/100% and idle-0 total |
| `src/components/RoundCard.test.tsx` | Work/Rest region scoping, Pace only in reps mode, preset values |
| `src/components/TimerDisplay.test.tsx` | Timed countdown, reps target + elapsed, NEXT kicker, cooldown copy |
| `src/components/form/PresetChips.test.tsx` | Equal-width chip distribution (`flex-1`, `min-w-0`) |

Untested surface (no direct tests): `WorkoutListScreen`, `CreateWorkoutScreen`, `WorkoutScreen`, `WorkoutRunner`, `SwipeToDelete`, `ConfirmSheet`, `PreStartPanel`, `CompletePanel`, `EmptyState`, `WorkoutCard`, `StepperRow`, `SegmentedToggle`, `TextField` (timer behavior is covered at hook level instead).

Commands: `pnpm test` (watch) / `pnpm test --run <path>` (one-shot) / `pnpm test:ui`; `pnpm typecheck`; `pnpm lint`; `pnpm build`; `pnpm dev` (port 5001, LAN).

<!-- repo-map-synced: ab417c09eeaab2a3f791a6083d52bad0481cf1d0 -->
