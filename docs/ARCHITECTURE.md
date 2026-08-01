# ARCHITECTURE

Answers: how is the system technically shaped? Populated and kept current by `/refresh-repo-map`. Do not hand-edit outside that workflow.

## System Boundary

Pure client-side SPA. No backend, no server API, no auth. All persistent state lives in browser IndexedDB via Dexie. External runtime surfaces are browser APIs and a CDN font:

- Web Speech API (`window.speechSynthesis`) — `src/lib/cues.ts#speak`
- Screen Wake Lock API (`navigator.wakeLock.request('screen')`) — `src/hooks/useWakeLock.ts`
- Google Fonts (Barlow, Barlow Condensed) via CSS `@import` — `src/index.css`; runtime-cached by the service worker
- IndexedDB (browser storage) — `src/db/db.ts#db`

Inside: `src/` (React app, hooks, db layer, lib), `public/` (PWA icons), config files, docs. Outside: any static host. No CI or deployment config exists; only LAN dev hosting is configured (`vite.config.ts` `host: true`).

## Primary Stack

React 19 + TypeScript 5.9 + Vite 7 (PWA) + Tailwind CSS v4 + shadcn/ui (Radix) + Dexie 4 + Vitest 4; pnpm 11. Routing: react-router 7 (hash router). Icons: lucide-react.

## Significant Dependencies

- **Dexie 4.4.4** — IndexedDB wrapper owning all persisted state; `dexie-react-hooks` provides `useLiveQuery` (reactive list updates on any DB write).
- **react-router 7.18.2** — `createHashRouter` data router (chosen so `useBlocker` works for quit-workout confirmation); hash routing avoids server rewrite rules.
- **radix-ui 1.4.3** — unified package; only `Slot`, `Slider`, `Switch` imported.
- **vite-plugin-pwa 1.3.0** — service worker + manifest at build; `registerType: 'autoUpdate'`; workbox runtime caching for Google Fonts.
- **@vite-pwa/assets-generator 1.0.2** — icons from `public/favicon.svg` (`minimal2023Preset`); apple icon 180px, `#0d1b2a` background.
- **portless 0.15.5** — `pnpm dev` wraps vite so port 5001 stays open across restarts.
- **@tailwindcss/vite 4.3.0** — Tailwind v4 via Vite plugin; no tailwind.config file; theme tokens live in CSS `@theme`.
- **fake-indexeddb 6.2.5** — in-memory IndexedDB for Vitest (tests import `fake-indexeddb/auto` first).
- **class-variance-authority / clsx / tailwind-merge** — `cn()` in `src/lib/utils.ts`; cva variants in `ui/button.tsx`.
- **@fontsource-variable/geist** and **tw-animate-css** — installed but unused.

## Components and Dependency Direction

```
App (createHashRouter + RouterProvider)
 └─ screens/ (route-level; import react-router hooks, useLiveQuery, repos)
     ├─ WorkoutListScreen ── WorkoutCard, SwipeToDelete, ConfirmSheet, EmptyState
     ├─ CreateWorkoutScreen ── RoundCard, form/* (TextField, PresetChips, SegmentedToggle, StepperRow), ui/switch
     └─ WorkoutScreen ── WorkoutRunner (keyed remount per workout.id) → PreStartPanel, TimerDisplay, ProgressBar, ControlButtons, CompletePanel, ConfirmSheet
components/ ── feature components
components/ui/ ── shadcn primitives (button, slider, switch, circular-progress) — depend only on radix-ui + cn()
components/form/ ── form controls
hooks/useWorkoutTimer.ts ── timer state machine (owns interval, phases, cues)
hooks/useWakeLock.ts ── screen wake lock
lib/ ── pure functions: cues, duration, phaseView, relativeTime, utils
db/ ── db.ts (Dexie instance + versions + ready hook), schema.ts (types + LIMITS/PRESETS),
      workoutRepo.ts (CRUD), seed.ts (applySeeds), seeds.ts (seed data)
```

Direction: `App → screens → components → ui/lib → hooks → db → Dexie`. Enforced by construction:

- `src/db/seed.ts` and `src/db/seeds.ts` use type-only imports of `db`/`workoutRepo` so there is no runtime import cycle with `db.ts` (`db.ts` imports seed.ts, never the reverse).
- Screens never touch Dexie directly; they go through `workoutRepo`.
- `ui/` components have no imports of app features.

## Integrations and State Ownership

**Dexie (persisted state)** — DB `HiitDB` (`src/db/db.ts#db`):

- v1 `workouts: '++id, lastUsedAt, createdAt'` — auto-increment id; only lookup fields indexed; `rounds` is an embedded array, never indexed.
- v2 `appliedSeeds: 'id'` — string key, no auto-increment; plain `Table` because seed-authored ids must be supplied on `add()`.
- Records: `Workout { id, name, prepareDelay, prepareSeconds, rounds[], createdAt, lastUsedAt }` and `AppliedSeed { id, appliedAt }` (`src/db/schema.ts`).

**React state ownership:**

- `useWorkoutTimer(workout)` owns the full timer state machine (`Phase = idle|prep|work|rest|cooldown|done`) in a single `useState<TimerState>`; drives a 1s `setInterval` tick via `stateRef`/`workoutRef` refs to avoid stale closures; actions `start/pause/completeReps/reset`; reps rounds count up and wait for `completeReps`.
- `WorkoutRunner` owns run-screen composition: wake lock (`useWakeLock(isActive && timer.isRunning)`), quit blocker, `markUsed` stamping, phase background mapping.
- `CreateWorkoutScreen` owns form drafts (`RoundDraft` with monotonic `key` counter) and validation via `LIMITS`.
- Repo functions take `now: number` as a parameter for deterministic tests.
- localStorage: not used anywhere in current `src/`.

**Web Speech API** — `src/lib/cues.ts#speak`: cancels then speaks one utterance; no-ops if API missing (jsdom). Cue policy in `useWorkoutTimer`: user-initiated cues deferred with `setTimeout(0)` (StrictMode double-invoke protection); interval-tick cues synchronous; countdown spoken at ≤3s.

**Screen Wake Lock** — `src/hooks/useWakeLock.ts`: request `'screen'` on activate, re-acquire on `visibilitychange` (browser drops lock when page hidden), silently no-ops where API missing, swallows denials.

## Runtime and Deployment

- PWA manifest generated by `VitePWA` (`vite.config.ts`): name "HIIT Timer", `display: standalone`, `orientation: portrait`, colors `#0d1b2a`.
- Service worker: `registerType: 'autoUpdate'`; workbox `globPatterns` for js/css/html/svg/png/ico/woff/woff2; runtime cache `google-fonts` `CacheFirst` with 1-year expiry; disabled in dev.
- `index.html`: `viewport-fit=cover`, theme-color, `mobile-web-app-capable`, apple metas, apple-touch-icon.
- Dev server: port **5001**, `host: true` (LAN-reachable from phones). `pnpm dev` = `portless run --name hiit --app-port 5001 pnpm run dev:vite`.
- Preview: `vite preview`. No production hosting configured.

## Development Environment

- Install: `pnpm install` (pnpm 11.1.1 pinned via `packageManager`)
- Dev: `pnpm dev` → http://localhost:5001 (LAN-reachable); bare vite: `pnpm dev:vite`
- Build: `pnpm build` = `tsc -b && vite build`
- Lint: `pnpm lint` = `eslint .`
- Typecheck: `pnpm typecheck` = `tsc -b --noEmit`
- Test: `pnpm test` (watch) / `pnpm test:ui`; one-shot is `pnpm test --run <path>` (bare `pnpm test` hangs)
- Preview: `pnpm preview`
- Format: `pnpm format` = `prettier --write "**/*.{ts,tsx}"` — repo style for `src/db/*` is single quotes/no semicolons, which contradicts `.prettierrc`; do not run per plan
- PWA assets: `pnpm generate-pwa-assets`
- Test infra (`vite.config.ts`): jsdom, globals, `setupFiles: ['./src/test/setup.ts']`, `passWithNoTests`; `src/test/setup.ts` adds jest-dom + ResizeObserver stub (Radix UI Slider)

## Architectural Constraints

- **Dexie additive versioning** — every schema change is a new `db.version(n)`; old declarations stay so existing DBs upgrade in place (`src/db/db.ts`).
- **VIP-zone seed pattern** — `db.on('ready', handler, true)` (sticky) with the VIP proxy passed in; `applySeeds` is deliberately NOT an `async function` because `db.transaction()` must be called synchronously before the first await or it deadlocks behind `open()` (`db.ts`, `seed.ts`). The `.catch` is load-bearing: a rejected `ready` handler fails `db.open()`.
- **Seed idempotency contract** — seeds delivered exactly once per database; seed ids are permanent and never reused (changing `ten-minute-hiit-v1` re-delivers to all installs); deleting a seeded workout does not bring it back.
- **Testability injection** — `now` and the `db` instance are always parameters.
- **StrictMode-safe speech** — cues from inside `setState` updaters must be deferred (`cue()` via setTimeout); interval-tick cues must be synchronous (`cueNow()`).
- **Wake lock quirks** — browser drops the lock on page hide → re-acquire on `visibilitychange`; silently no-op on missing API (older iOS, jsdom).
- **TS strictness** — `strict`, `noUnusedLocals/Parameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `verbatimModuleSyntax` (type-only imports enforced), `allowImportingTsExtensions`, `@/*` → `./src/*` alias.
- **Type-only import discipline in the db layer** — `seed.ts`/`seeds.ts` import `HiitDb`/`NewWorkout` only as types to avoid runtime cycles.
- **react-router blockers** — data router required for `useBlocker`; hash routing avoids server rewrites; extra effect needed because react-router never un-blocks on its own (`WorkoutRunner`).
- **Single-source validation bounds** — `LIMITS`/`PRESETS`/`DEFAULT_ROUND`/`DEFAULT_PREPARE_SECONDS` in `src/db/schema.ts` drive the create form, and tests pin seeds inside those limits.
- **Round order invariant** — `order` always equals array index + 1: renumbered on save, authored correctly in seeds, asserted by tests.
- **Mobile-first constraints** — `max-w-sm` column, `100dvh`, `env(safe-area-inset-*)` padding, `overscroll-behavior` containment, `touch-action: manipulation`, `prefers-reduced-motion` override, `.screen-fixed` (runner never scrolls) vs `.screen-scroll`.
- **No ADRs recorded yet** — `docs/adr/INDEX.md` table is empty; `docs/deferred/INDEX.md` is empty.

<!-- repo-map-synced: ab417c09eeaab2a3f791a6083d52bad0481cf1d0 -->
