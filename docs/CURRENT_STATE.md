# CURRENT_STATE

## Purpose
Mobile-responsive HIIT timer SPA for personal use — configurable work/rest rounds, speech cues, localStorage persistence.

## Stack
React 19 ⊕ Vite 7 ⊕ TypeScript 5.9 ⊕ Tailwind CSS v4 ⊕ shadcn/ui (Radix/Nova) ⊕ Vitest 4 ⊕ pnpm

## Shipped capabilities
- HIIT state machine: idle → prep(5s) → work → rest → (×rounds) → done → auto-reset(2s) → idle
- Web Speech API cues: "3"/"2"/"1" countdown at last 3s of each interval; "Get ready!"/"Work!"/"Rest!"/"Done!" on transitions
- Settings: work time (5–300s), rest time (5–300s), rounds (1–20), prepare delay toggle
- Settings persist to localStorage; restored on page load
- Settings locked during active workout, unlocked at idle
- Progress bar advances linearly through each phase interval
- Phase color coding: idle=white, prep=amber-400, work=green-400, rest=blue-400, done=teal-400
- PAUSE mid-interval; RESUME from same second; RESET to idle
- Mobile-first layout (max-w-sm, full-height column); no horizontal scroll at 375px

## Source map
- `src/hooks/useHiitTimer.ts` — core state machine hook; `stateRef` pattern for sync interval access; localStorage load/save
- `src/hooks/useHiitTimer.test.ts` — 16 unit tests; fake timers, localStorage mock, speech mock
- `src/components/TimerDisplay.tsx` — countdown MM:SS + phase label + round counter
- `src/components/TimerDisplay.test.tsx` — display rendering tests
- `src/components/ProgressBar.tsx` — linear fill `data-testid="progress-fill"`; 0→100% over phase duration
- `src/components/ProgressBar.test.tsx` — progress bar tests
- `src/components/ControlButtons.tsx` — START/PAUSE/RESUME + RESET (↺); RESET disabled when idle
- `src/components/ControlButtons.test.tsx` — button state tests
- `src/components/SettingsPanel.tsx` — Slider+Switch+±buttons; locked overlay when `isLocked`
- `src/components/SettingsPanel.test.tsx` — settings render + lock tests
- `src/components/ui/button.tsx` — shadcn Button
- `src/components/ui/slider.tsx` — shadcn Slider (needs ResizeObserver stub in jsdom)
- `src/components/ui/switch.tsx` — shadcn Switch
- `src/components/theme-provider.tsx` — shadcn ThemeProvider (unused in App currently)
- `src/lib/utils.ts` — `cn()` helper
- `src/App.tsx` — composes all components; `getPhaseTotalTime` for ProgressBar
- `src/main.tsx` — React root mount
- `src/index.css` — `@import "tailwindcss"` ⊕ dark navy body (#0d1b2a)
- `src/test/setup.ts` — `@testing-library/jest-dom` ⊕ ResizeObserver no-op stub
- `vite.config.ts` — Tailwind v4 plugin ⊕ `@` alias ⊕ Vitest jsdom config ⊕ `passWithNoTests: true`
- `docs/superpowers/specs/2026-05-13-hiit-timer-design.md` — original design doc
- `docs/superpowers/plans/2026-05-13-hiit-timer.md` — implementation plan

## Patterns in use
- Custom hook (state machine) → `src/hooks/useHiitTimer.ts`
- stateRef (sync interval reads) → `useHiitTimer.ts:78-79`
- shadcn/ui component library → `src/components/ui/`
- Fake-timer unit tests → `src/hooks/useHiitTimer.test.ts`

## Public interfaces
- Single SPA route: `/` (Vite dev: `localhost:5173`)
- localStorage keys: `hiit_work_time`, `hiit_rest_time`, `hiit_rounds`, `hiit_prepare_delay`

## Data model
No backend. State in React + localStorage only.
- `HiitSettings` → `useHiitTimer.ts:3-8`
- `Phase` → `useHiitTimer.ts:10`
- `TimerState` → `useHiitTimer.ts:12-18`

## Debt / TODO
- `theme-provider.tsx` added by shadcn init but not wired into App
- E2E: PREP phase, full round-cycle, DONE→idle auto-reset not yet verified via Playwright
