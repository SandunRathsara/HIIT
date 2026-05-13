# HIIT Timer — Design Spec

**Date:** 2026-05-13
**Status:** Approved

---

## Context

A mobile-responsive HIIT timer web app built with React + Vite. No backend — all state persists in localStorage. Inspired by simplehiittimer.com but simpler in scope: core timer controls only, no user accounts or workout history. Intended as a personal-use tool deployable as a static site.

---

## Visual Design

- **Theme:** Dark navy + teal (`#0d1b2a` background, `#17b8a3` accent)
- **Phase color coding:**
  - PREP → amber (`#f59e0b`)
  - WORK → green (`#22c55e`)
  - REST → blue (`#3b82f6`)
  - DONE → teal (`#17b8a3`)
- **Typography:** Monospace for the countdown display; system-ui for labels
- **Mobile-first:** Single-column layout, touch-optimized controls (min 44px tap targets)

---

## Features

### Timer Settings (all persisted to localStorage)

| Setting | Default | Range | Step |
|---|---|---|---|
| Work time | 30s | 5–300s | 5s |
| Rest time | 10s | 5–300s | 5s |
| Rounds | 4 | 1–20 | 1 |
| Prepare delay | on | boolean | — |

Each setting has +/− buttons and a range slider. Settings panel is **locked while the timer is running**.

### State Machine

```
idle → [START] → prep (5s, if enabled) → work → rest → (repeat × rounds) → done
```

- `pause` and `reset` available from any active state
- `reset` returns to `idle` with settings intact
- After `done`, auto-transitions back to `idle`

### Sound (Web Speech API)

- Last 3 seconds of every interval: speaks "3", "2", "1"
- On phase transition: speaks "Work!", "Rest!", "Done!"
- No external dependencies; silently no-ops if browser unsupported

### Progress Bar

- Fills left-to-right across the current interval's duration
- Color matches current phase
- Resets on each interval transition

---

## Architecture

### Tech Stack

- **React 18 + Vite** — component UI, hot reload in dev
- **shadcn/ui** — component library (Button, Slider, Switch, etc.) — latest version via shadcn CLI
- **Tailwind CSS v4** — utility styling (bundled with shadcn)
- **localStorage** — settings persistence, no backend
- **Web Speech API** — audio cues, browser-native

> **Tooling note:** Use `rtk proxy npx <package>` for all npx commands. Fetch latest docs via shadcn MCP and find-docs skill before implementation.

### File Structure

```
hiit/
  index.html
  src/
    main.jsx
    App.jsx                      # composes hook + components
    hooks/
      useHiitTimer.js            # all timer logic + localStorage + speech
    components/
      TimerDisplay.jsx           # countdown, phase label, round indicator
      ControlButtons.jsx         # Start/Pause/Reset
      SettingsPanel.jsx          # work/rest/rounds/delay controls + sliders
      ProgressBar.jsx            # phase progress strip
    index.css                    # global styles + CSS variables
  vite.config.js
  package.json
```

### `useHiitTimer` Hook Interface

```js
const {
  phase,        // 'idle' | 'prep' | 'work' | 'rest' | 'done'
  timeLeft,     // seconds remaining in current interval
  currentRound, // 1-based current round
  settings,     // { workTime, restTime, rounds, prepareDelay }
  isRunning,    // boolean
  start,        // () => void
  pause,        // () => void
  reset,        // () => void
  updateSetting // (key, value) => void — saves to localStorage
} = useHiitTimer()
```

**Internals:**
- `setInterval` (1s tick) started on `start`, cleared on `pause`/`reset`/`done`
- Phase transitions triggered when `timeLeft` reaches 0
- Speech calls fire on phase entry and at `timeLeft === 3, 2, 1`
- Settings read from localStorage on mount; written on every `updateSetting` call

### localStorage Keys

```
hiit_work_time      → number (seconds)
hiit_rest_time      → number (seconds)
hiit_rounds         → number
hiit_prepare_delay  → boolean
```

---

## UI Behaviour

- **Idle:** Full settings panel visible; START + Reset buttons shown
- **Active:** Settings panel shows "locked" state; PAUSE + Reset buttons shown
- **Paused:** Settings remain locked; START (resume) + Reset shown
- **Done:** Brief "Done!" display, then auto-resets to idle after 2s

---

## Verification

1. `npm create vite@latest`, install deps, `npm run dev`
2. Adjust work/rest/rounds/delay → confirm values persist after page refresh
3. Hit START → confirm prep countdown fires (if enabled), transitions to WORK
4. Confirm phase label, color, and progress bar all update correctly
5. Let one full round complete → confirm REST phase follows, round counter increments
6. Let all rounds complete → confirm DONE state, then idle
7. Confirm speech fires at 3/2/1 and on each phase entry
8. Test on mobile viewport (375px) — all controls reachable, no horizontal scroll
9. Pause mid-interval → resume → confirm time resumes from correct position
10. Reset mid-workout → confirm returns to idle with settings intact
