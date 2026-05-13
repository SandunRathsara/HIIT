# HIIT Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-responsive HIIT timer SPA with work/rest/rounds/delay settings, voice countdown cues, and localStorage persistence.

**Architecture:** Custom `useHiitTimer` hook owns the full state machine (idle→prep→work→rest→done), tick logic, localStorage I/O, and Web Speech API calls. Four thin components (`TimerDisplay`, `ProgressBar`, `ControlButtons`, `SettingsPanel`) read from the hook and call its actions. `App.tsx` composes them.

**Tech Stack:** React 18, Vite, TypeScript, shadcn/ui (Button, Slider, Switch), Tailwind CSS v4, Vitest, @testing-library/react

---

## File Map

| File | Purpose |
|---|---|
| `src/hooks/useHiitTimer.ts` | State machine, tick, localStorage, speech |
| `src/hooks/useHiitTimer.test.ts` | Hook unit tests (TDD) |
| `src/components/TimerDisplay.tsx` | Countdown, phase label, round indicator |
| `src/components/TimerDisplay.test.tsx` | Display render tests |
| `src/components/ProgressBar.tsx` | Phase progress strip |
| `src/components/ProgressBar.test.tsx` | Progress width tests |
| `src/components/ControlButtons.tsx` | Start/Pause/Reset buttons |
| `src/components/ControlButtons.test.tsx` | Button state render tests |
| `src/components/SettingsPanel.tsx` | Work/rest/rounds/delay controls |
| `src/components/SettingsPanel.test.tsx` | Settings render + interaction tests |
| `src/App.tsx` | Composes hook + all components |
| `src/test/setup.ts` | Vitest/jsdom global setup |
| `src/index.css` | Tailwind v4 base import + resets |

---

## Task 1: Scaffold project

**Files:**
- Creates: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `components.json`

- [ ] **Step 1: Run shadcn Vite init**

```bash
cd /Users/alpha/Developer/personal/hiit
rtk proxy npx shadcn@latest init -t vite
```

When prompted:
- Project name / directory → press Enter (uses current dir) or type `.`
- Style → **Default**
- Base color → **Slate**
- Overwrite existing files → **Yes**

- [ ] **Step 2: Add shadcn components**

```bash
rtk proxy npx shadcn@latest add @shadcn/button @shadcn/slider @shadcn/switch
```

- [ ] **Step 3: Verify component files exist**

```bash
ls src/components/ui/
```

Expected output includes: `button.tsx`, `slider.tsx`, `switch.tsx`

- [ ] **Step 4: Start dev server and verify it runs**

```bash
npm run dev
```

Expected: dev server running at `http://localhost:5173`. Open it — default shadcn demo page should load with no console errors. Stop the server (`Ctrl+C`).

- [ ] **Step 5: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold React+Vite+shadcn project"
```

---

## Task 2: Configure Vitest

**Files:**
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @vitest/ui
```

- [ ] **Step 2: Update `vite.config.ts`**

Replace the entire file with:

```typescript
/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 3: Create `src/test/setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test scripts to `package.json`**

In the `"scripts"` section, add:

```json
"test": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 5: Verify Vitest runs**

```bash
npm test -- --run
```

Expected: no test files found, exit 0 (or a message like "No test files found").

- [ ] **Step 6: Commit**

```bash
git add vite.config.ts src/test/setup.ts package.json
git commit -m "chore: configure Vitest with jsdom and testing-library"
```

---

## Task 3: `useHiitTimer` hook (TDD)

**Files:**
- Create: `src/hooks/useHiitTimer.ts`
- Create: `src/hooks/useHiitTimer.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/useHiitTimer.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useHiitTimer } from './useHiitTimer'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })
Object.defineProperty(window, 'speechSynthesis', {
  value: { speak: vi.fn(), cancel: vi.fn() },
  writable: true,
})

describe('useHiitTimer', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('initializes with defaults', () => {
    const { result } = renderHook(() => useHiitTimer())
    expect(result.current.phase).toBe('idle')
    expect(result.current.timeLeft).toBe(30)
    expect(result.current.currentRound).toBe(1)
    expect(result.current.isRunning).toBe(false)
    expect(result.current.settings).toEqual({
      workTime: 30, restTime: 10, rounds: 4, prepareDelay: true,
    })
  })

  it('loads settings from localStorage', () => {
    localStorageMock.setItem('hiit_work_time', '45')
    localStorageMock.setItem('hiit_rest_time', '15')
    localStorageMock.setItem('hiit_rounds', '6')
    localStorageMock.setItem('hiit_prepare_delay', 'false')
    const { result } = renderHook(() => useHiitTimer())
    expect(result.current.settings).toEqual({
      workTime: 45, restTime: 15, rounds: 6, prepareDelay: false,
    })
  })

  it('start() goes to prep when prepareDelay is true', () => {
    const { result } = renderHook(() => useHiitTimer())
    act(() => { result.current.start() })
    expect(result.current.phase).toBe('prep')
    expect(result.current.timeLeft).toBe(5)
    expect(result.current.isRunning).toBe(true)
  })

  it('start() goes to work when prepareDelay is false', () => {
    localStorageMock.setItem('hiit_prepare_delay', 'false')
    const { result } = renderHook(() => useHiitTimer())
    act(() => { result.current.start() })
    expect(result.current.phase).toBe('work')
    expect(result.current.timeLeft).toBe(30)
  })

  it('tick decrements timeLeft by 1 per second', () => {
    const { result } = renderHook(() => useHiitTimer())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.timeLeft).toBe(4) // prep started at 5
  })

  it('transitions prep → work after 5 ticks', () => {
    const { result } = renderHook(() => useHiitTimer())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(5000) })
    expect(result.current.phase).toBe('work')
    expect(result.current.timeLeft).toBe(30)
  })

  it('transitions work → rest after workTime ticks', () => {
    localStorageMock.setItem('hiit_prepare_delay', 'false')
    const { result } = renderHook(() => useHiitTimer())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(30000) })
    expect(result.current.phase).toBe('rest')
    expect(result.current.timeLeft).toBe(10)
  })

  it('transitions rest → work and increments round', () => {
    localStorageMock.setItem('hiit_prepare_delay', 'false')
    const { result } = renderHook(() => useHiitTimer())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(40000) }) // 30s work + 10s rest
    expect(result.current.phase).toBe('work')
    expect(result.current.currentRound).toBe(2)
  })

  it('reaches done after all rounds complete', () => {
    localStorageMock.setItem('hiit_prepare_delay', 'false')
    localStorageMock.setItem('hiit_rounds', '1')
    const { result } = renderHook(() => useHiitTimer())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(30000) })
    expect(result.current.phase).toBe('done')
    expect(result.current.isRunning).toBe(false)
  })

  it('auto-resets to idle 2s after done', () => {
    localStorageMock.setItem('hiit_prepare_delay', 'false')
    localStorageMock.setItem('hiit_rounds', '1')
    const { result } = renderHook(() => useHiitTimer())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(32000) }) // 30s work + 2s auto-reset
    expect(result.current.phase).toBe('idle')
  })

  it('pause() stops the countdown', () => {
    const { result } = renderHook(() => useHiitTimer())
    act(() => { result.current.start() })
    act(() => { result.current.pause() })
    const frozen = result.current.timeLeft
    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current.timeLeft).toBe(frozen)
    expect(result.current.isRunning).toBe(false)
  })

  it('start() after pause() resumes countdown', () => {
    const { result } = renderHook(() => useHiitTimer())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(2000) })
    act(() => { result.current.pause() })
    const frozen = result.current.timeLeft
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.timeLeft).toBe(frozen - 1)
  })

  it('reset() returns to idle with workTime timeLeft', () => {
    const { result } = renderHook(() => useHiitTimer())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(2000) })
    act(() => { result.current.reset() })
    expect(result.current.phase).toBe('idle')
    expect(result.current.currentRound).toBe(1)
    expect(result.current.timeLeft).toBe(30)
    expect(result.current.isRunning).toBe(false)
  })

  it('updateSetting persists to localStorage', () => {
    const { result } = renderHook(() => useHiitTimer())
    act(() => { result.current.updateSetting('workTime', 45) })
    expect(result.current.settings.workTime).toBe(45)
    expect(localStorageMock.getItem('hiit_work_time')).toBe('45')
  })

  it('updateSetting("workTime") updates timeLeft when idle', () => {
    const { result } = renderHook(() => useHiitTimer())
    act(() => { result.current.updateSetting('workTime', 45) })
    expect(result.current.timeLeft).toBe(45)
  })

  it('updateSetting("workTime") does not change timeLeft when running', () => {
    localStorageMock.setItem('hiit_prepare_delay', 'false')
    const { result } = renderHook(() => useHiitTimer())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(2000) })
    const timeBeforeUpdate = result.current.timeLeft
    act(() => { result.current.updateSetting('workTime', 45) })
    expect(result.current.timeLeft).toBe(timeBeforeUpdate)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- --run src/hooks/useHiitTimer.test.ts
```

Expected: all tests FAIL with "Cannot find module './useHiitTimer'"

- [ ] **Step 3: Create `src/hooks/useHiitTimer.ts`**

```typescript
import { useCallback, useEffect, useRef, useState } from 'react'

export interface HiitSettings {
  workTime: number
  restTime: number
  rounds: number
  prepareDelay: boolean
}

export type Phase = 'idle' | 'prep' | 'work' | 'rest' | 'done'

interface TimerState {
  phase: Phase
  timeLeft: number
  currentRound: number
  settings: HiitSettings
  isRunning: boolean
}

const KEYS = {
  workTime: 'hiit_work_time',
  restTime: 'hiit_rest_time',
  rounds: 'hiit_rounds',
  prepareDelay: 'hiit_prepare_delay',
} as const

const DEFAULTS: HiitSettings = {
  workTime: 30,
  restTime: 10,
  rounds: 4,
  prepareDelay: true,
}

function loadSettings(): HiitSettings {
  return {
    workTime: Number(localStorage.getItem(KEYS.workTime)) || DEFAULTS.workTime,
    restTime: Number(localStorage.getItem(KEYS.restTime)) || DEFAULTS.restTime,
    rounds: Number(localStorage.getItem(KEYS.rounds)) || DEFAULTS.rounds,
    prepareDelay: localStorage.getItem(KEYS.prepareDelay) !== 'false',
  }
}

function speak(text: string) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
}

function advancePhase(prev: TimerState): TimerState {
  const { phase, currentRound, settings } = prev
  switch (phase) {
    case 'prep':
      queueMicrotask(() => speak('Work!'))
      return { ...prev, phase: 'work', timeLeft: settings.workTime }
    case 'work':
      if (currentRound >= settings.rounds) {
        queueMicrotask(() => speak('Done!'))
        return { ...prev, phase: 'done', timeLeft: 0, isRunning: false }
      }
      queueMicrotask(() => speak('Rest!'))
      return { ...prev, phase: 'rest', timeLeft: settings.restTime }
    case 'rest':
      queueMicrotask(() => speak('Work!'))
      return { ...prev, phase: 'work', timeLeft: settings.workTime, currentRound: currentRound + 1 }
    default:
      return prev
  }
}

export function useHiitTimer() {
  const [state, setState] = useState<TimerState>(() => {
    const settings = loadSettings()
    return { phase: 'idle', timeLeft: settings.workTime, currentRound: 1, settings, isRunning: false }
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (state.phase === 'done') {
      stopInterval()
      const t = setTimeout(() => {
        setState(prev => ({
          ...prev,
          phase: 'idle',
          currentRound: 1,
          timeLeft: prev.settings.workTime,
          isRunning: false,
        }))
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [state.phase, stopInterval])

  useEffect(() => () => stopInterval(), [stopInterval])

  const startInterval = useCallback(() => {
    stopInterval()
    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (!prev.isRunning) return prev
        const newTimeLeft = prev.timeLeft - 1
        if (newTimeLeft <= 3 && newTimeLeft > 0) {
          queueMicrotask(() => speak(String(newTimeLeft)))
        }
        if (newTimeLeft > 0) return { ...prev, timeLeft: newTimeLeft }
        return advancePhase(prev)
      })
    }, 1000)
  }, [stopInterval])

  const start = useCallback(() => {
    setState(prev => {
      if (prev.phase === 'idle') {
        const phase = prev.settings.prepareDelay ? 'prep' : 'work'
        const timeLeft = prev.settings.prepareDelay ? 5 : prev.settings.workTime
        queueMicrotask(() => speak(phase === 'prep' ? 'Get ready!' : 'Work!'))
        return { ...prev, phase, timeLeft, isRunning: true, currentRound: 1 }
      }
      if (prev.phase !== 'done') return { ...prev, isRunning: true }
      return prev
    })
    startInterval()
  }, [startInterval])

  const pause = useCallback(() => {
    stopInterval()
    setState(prev => ({ ...prev, isRunning: false }))
  }, [stopInterval])

  const reset = useCallback(() => {
    stopInterval()
    setState(prev => ({
      ...prev,
      phase: 'idle',
      timeLeft: prev.settings.workTime,
      currentRound: 1,
      isRunning: false,
    }))
  }, [stopInterval])

  const updateSetting = useCallback(<K extends keyof HiitSettings>(key: K, value: HiitSettings[K]) => {
    localStorage.setItem(KEYS[key], String(value))
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value },
      timeLeft: key === 'workTime' && prev.phase === 'idle' ? (value as number) : prev.timeLeft,
    }))
  }, [])

  return {
    phase: state.phase,
    timeLeft: state.timeLeft,
    currentRound: state.currentRound,
    settings: state.settings,
    isRunning: state.isRunning,
    start,
    pause,
    reset,
    updateSetting,
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- --run src/hooks/useHiitTimer.test.ts
```

Expected: all 15 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: useHiitTimer hook with state machine, localStorage, speech"
```

---

## Task 4: `TimerDisplay` component (TDD)

**Files:**
- Create: `src/components/TimerDisplay.tsx`
- Create: `src/components/TimerDisplay.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/TimerDisplay.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TimerDisplay } from './TimerDisplay'

describe('TimerDisplay', () => {
  it('formats seconds under 60 as 0:SS', () => {
    render(<TimerDisplay phase="idle" timeLeft={30} currentRound={1} totalRounds={4} />)
    expect(screen.getByText('00:30')).toBeInTheDocument()
  })

  it('formats seconds ≥ 60 as M:SS', () => {
    render(<TimerDisplay phase="idle" timeLeft={90} currentRound={1} totalRounds={4} />)
    expect(screen.getByText('01:30')).toBeInTheDocument()
  })

  it('shows READY label when idle', () => {
    render(<TimerDisplay phase="idle" timeLeft={30} currentRound={1} totalRounds={4} />)
    expect(screen.getByText('READY')).toBeInTheDocument()
  })

  it('shows WORK label when in work phase', () => {
    render(<TimerDisplay phase="work" timeLeft={25} currentRound={2} totalRounds={4} />)
    expect(screen.getByText(/WORK/)).toBeInTheDocument()
  })

  it('shows REST label when in rest phase', () => {
    render(<TimerDisplay phase="rest" timeLeft={10} currentRound={1} totalRounds={4} />)
    expect(screen.getByText(/REST/)).toBeInTheDocument()
  })

  it('shows GET READY label when in prep phase', () => {
    render(<TimerDisplay phase="prep" timeLeft={5} currentRound={1} totalRounds={4} />)
    expect(screen.getByText(/GET READY/)).toBeInTheDocument()
  })

  it('shows round indicator when not idle', () => {
    render(<TimerDisplay phase="work" timeLeft={25} currentRound={2} totalRounds={4} />)
    expect(screen.getByText('ROUND 2 / 4')).toBeInTheDocument()
  })

  it('shows total rounds when idle', () => {
    render(<TimerDisplay phase="idle" timeLeft={30} currentRound={1} totalRounds={4} />)
    expect(screen.getByText('4 ROUNDS')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- --run src/components/TimerDisplay.test.tsx
```

Expected: FAIL with "Cannot find module './TimerDisplay'"

- [ ] **Step 3: Create `src/components/TimerDisplay.tsx`**

```typescript
import type { Phase } from '@/hooks/useHiitTimer'

interface TimerDisplayProps {
  phase: Phase
  timeLeft: number
  currentRound: number
  totalRounds: number
}

const PHASE_COLORS: Record<Phase, string> = {
  idle: 'text-white',
  prep: 'text-amber-400',
  work: 'text-green-400',
  rest: 'text-blue-400',
  done: 'text-teal-400',
}

const PHASE_LABELS: Record<Phase, string> = {
  idle: 'READY',
  prep: 'GET READY',
  work: 'WORK',
  rest: 'REST',
  done: 'DONE!',
}

export function TimerDisplay({ phase, timeLeft, currentRound, totalRounds }: TimerDisplayProps) {
  const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const ss = (timeLeft % 60).toString().padStart(2, '0')
  const showDot = phase !== 'idle' && phase !== 'done'

  return (
    <div className="text-center py-8 px-5">
      <div className={`text-xs font-bold tracking-widest uppercase mb-2 ${PHASE_COLORS[phase]}`}>
        {showDot && <span className="mr-1">●</span>}
        {PHASE_LABELS[phase]}
      </div>
      <div className="text-8xl font-black font-mono tracking-tighter text-white leading-none">
        {mm}:{ss}
      </div>
      <div className="text-xs text-gray-400 mt-3 tracking-widest">
        {phase !== 'idle'
          ? `ROUND ${currentRound} / ${totalRounds}`
          : `${totalRounds} ROUNDS`}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- --run src/components/TimerDisplay.test.tsx
```

Expected: all 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TimerDisplay.tsx src/components/TimerDisplay.test.tsx
git commit -m "feat: TimerDisplay component"
```

---

## Task 5: `ProgressBar` component (TDD)

**Files:**
- Create: `src/components/ProgressBar.tsx`
- Create: `src/components/ProgressBar.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/ProgressBar.test.tsx`:

```typescript
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProgressBar } from './ProgressBar'

function getBar(container: HTMLElement) {
  return container.querySelector('[data-testid="progress-fill"]') as HTMLElement
}

describe('ProgressBar', () => {
  it('renders 0% width at start of interval', () => {
    const { container } = render(<ProgressBar phase="work" timeLeft={30} totalTime={30} />)
    expect(getBar(container).style.width).toBe('0%')
  })

  it('renders 50% width at half-way through interval', () => {
    const { container } = render(<ProgressBar phase="work" timeLeft={15} totalTime={30} />)
    expect(getBar(container).style.width).toBe('50%')
  })

  it('renders 100% width for done phase', () => {
    const { container } = render(<ProgressBar phase="done" timeLeft={0} totalTime={0} />)
    expect(getBar(container).style.width).toBe('100%')
  })

  it('renders 0% when totalTime is 0 and phase is idle', () => {
    const { container } = render(<ProgressBar phase="idle" timeLeft={30} totalTime={0} />)
    expect(getBar(container).style.width).toBe('0%')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- --run src/components/ProgressBar.test.tsx
```

Expected: FAIL with "Cannot find module './ProgressBar'"

- [ ] **Step 3: Create `src/components/ProgressBar.tsx`**

```typescript
import type { Phase } from '@/hooks/useHiitTimer'

interface ProgressBarProps {
  phase: Phase
  timeLeft: number
  totalTime: number
}

const PHASE_FILL_COLORS: Record<Phase, string> = {
  idle: 'bg-teal-500',
  prep: 'bg-amber-400',
  work: 'bg-green-400',
  rest: 'bg-blue-400',
  done: 'bg-teal-400',
}

export function ProgressBar({ phase, timeLeft, totalTime }: ProgressBarProps) {
  const pct = phase === 'done'
    ? 100
    : totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0

  return (
    <div className="h-1 bg-slate-700 mx-0">
      <div
        data-testid="progress-fill"
        className={`h-full transition-all duration-1000 ${PHASE_FILL_COLORS[phase]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- --run src/components/ProgressBar.test.tsx
```

Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ProgressBar.tsx src/components/ProgressBar.test.tsx
git commit -m "feat: ProgressBar component"
```

---

## Task 6: `ControlButtons` component (TDD)

**Files:**
- Create: `src/components/ControlButtons.tsx`
- Create: `src/components/ControlButtons.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/ControlButtons.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ControlButtons } from './ControlButtons'
import type { Phase } from '@/hooks/useHiitTimer'

const noop = vi.fn()

function renderButtons(phase: Phase, isRunning: boolean) {
  return render(
    <ControlButtons
      phase={phase}
      isRunning={isRunning}
      onStart={noop}
      onPause={noop}
      onReset={noop}
    />
  )
}

describe('ControlButtons', () => {
  it('shows START when idle and not running', () => {
    renderButtons('idle', false)
    expect(screen.getByRole('button', { name: 'START' })).toBeInTheDocument()
  })

  it('shows PAUSE when running', () => {
    renderButtons('work', true)
    expect(screen.getByRole('button', { name: 'PAUSE' })).toBeInTheDocument()
  })

  it('shows RESUME when paused mid-workout', () => {
    renderButtons('work', false)
    expect(screen.getByRole('button', { name: 'RESUME' })).toBeInTheDocument()
  })

  it('reset button is disabled when idle', () => {
    renderButtons('idle', false)
    expect(screen.getByRole('button', { name: '↺' })).toBeDisabled()
  })

  it('reset button is enabled when running', () => {
    renderButtons('work', true)
    expect(screen.getByRole('button', { name: '↺' })).not.toBeDisabled()
  })

  it('calls onStart when START is clicked', async () => {
    const onStart = vi.fn()
    render(<ControlButtons phase="idle" isRunning={false} onStart={onStart} onPause={noop} onReset={noop} />)
    await userEvent.click(screen.getByRole('button', { name: 'START' }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('calls onPause when PAUSE is clicked', async () => {
    const onPause = vi.fn()
    render(<ControlButtons phase="work" isRunning={true} onStart={noop} onPause={onPause} onReset={noop} />)
    await userEvent.click(screen.getByRole('button', { name: 'PAUSE' }))
    expect(onPause).toHaveBeenCalledOnce()
  })

  it('calls onReset when ↺ is clicked', async () => {
    const onReset = vi.fn()
    render(<ControlButtons phase="work" isRunning={true} onStart={noop} onPause={noop} onReset={onReset} />)
    await userEvent.click(screen.getByRole('button', { name: '↺' }))
    expect(onReset).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- --run src/components/ControlButtons.test.tsx
```

Expected: FAIL with "Cannot find module './ControlButtons'"

- [ ] **Step 3: Create `src/components/ControlButtons.tsx`**

```typescript
import { Button } from '@/components/ui/button'
import type { Phase } from '@/hooks/useHiitTimer'

interface ControlButtonsProps {
  phase: Phase
  isRunning: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

export function ControlButtons({ phase, isRunning, onStart, onPause, onReset }: ControlButtonsProps) {
  const showPause = isRunning
  const showStartOrResume = !isRunning && phase !== 'done'
  const startLabel = phase === 'idle' ? 'START' : 'RESUME'

  return (
    <div className="flex gap-3 px-5 pb-5">
      {showStartOrResume && (
        <Button
          className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-base tracking-wider h-12 rounded-xl"
          onClick={onStart}
        >
          {startLabel}
        </Button>
      )}
      {showPause && (
        <Button
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-base tracking-wider h-12 rounded-xl"
          onClick={onPause}
        >
          PAUSE
        </Button>
      )}
      <Button
        variant="ghost"
        className="bg-slate-800 hover:bg-slate-700 text-slate-400 h-12 px-5 rounded-xl text-xl"
        onClick={onReset}
        disabled={phase === 'idle'}
        aria-label="↺"
      >
        ↺
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- --run src/components/ControlButtons.test.tsx
```

Expected: all 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ControlButtons.tsx src/components/ControlButtons.test.tsx
git commit -m "feat: ControlButtons component"
```

---

## Task 7: `SettingsPanel` component (TDD)

**Files:**
- Create: `src/components/SettingsPanel.tsx`
- Create: `src/components/SettingsPanel.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/SettingsPanel.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SettingsPanel } from './SettingsPanel'
import type { HiitSettings } from '@/hooks/useHiitTimer'

const defaultSettings: HiitSettings = {
  workTime: 30,
  restTime: 10,
  rounds: 4,
  prepareDelay: true,
}

describe('SettingsPanel', () => {
  it('shows settings when not locked', () => {
    render(<SettingsPanel settings={defaultSettings} isLocked={false} onUpdate={vi.fn()} />)
    expect(screen.getByText('WORK')).toBeInTheDocument()
    expect(screen.getByText('REST')).toBeInTheDocument()
    expect(screen.getByText('ROUNDS')).toBeInTheDocument()
    expect(screen.getByText('PREPARE DELAY')).toBeInTheDocument()
  })

  it('shows locked message instead of settings when locked', () => {
    render(<SettingsPanel settings={defaultSettings} isLocked={true} onUpdate={vi.fn()} />)
    expect(screen.getByText(/locked/i)).toBeInTheDocument()
    expect(screen.queryByText('WORK')).not.toBeInTheDocument()
  })

  it('calls onUpdate with incremented workTime when + clicked', async () => {
    const onUpdate = vi.fn()
    render(<SettingsPanel settings={defaultSettings} isLocked={false} onUpdate={onUpdate} />)
    const plusButtons = screen.getAllByRole('button', { name: '+' })
    await userEvent.click(plusButtons[0]) // first + is workTime
    expect(onUpdate).toHaveBeenCalledWith('workTime', 35)
  })

  it('calls onUpdate with decremented workTime when − clicked', async () => {
    const onUpdate = vi.fn()
    render(<SettingsPanel settings={defaultSettings} isLocked={false} onUpdate={onUpdate} />)
    const minusButtons = screen.getAllByRole('button', { name: '−' })
    await userEvent.click(minusButtons[0])
    expect(onUpdate).toHaveBeenCalledWith('workTime', 25)
  })

  it('calls onUpdate with new prepareDelay when switch toggled', async () => {
    const onUpdate = vi.fn()
    render(<SettingsPanel settings={defaultSettings} isLocked={false} onUpdate={onUpdate} />)
    const toggle = screen.getByRole('switch')
    await userEvent.click(toggle)
    expect(onUpdate).toHaveBeenCalledWith('prepareDelay', false)
  })

  it('displays formatted work time', () => {
    render(<SettingsPanel settings={{ ...defaultSettings, workTime: 90 }} isLocked={false} onUpdate={vi.fn()} />)
    expect(screen.getByText('1:30')).toBeInTheDocument()
  })

  it('displays rounds count', () => {
    render(<SettingsPanel settings={defaultSettings} isLocked={false} onUpdate={vi.fn()} />)
    expect(screen.getByText('4')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- --run src/components/SettingsPanel.test.tsx
```

Expected: FAIL with "Cannot find module './SettingsPanel'"

- [ ] **Step 3: Create `src/components/SettingsPanel.tsx`**

```typescript
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import type { HiitSettings } from '@/hooks/useHiitTimer'

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

interface SettingRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onDecrement: () => void
  onIncrement: () => void
  onChange: (v: number) => void
  disabled: boolean
}

function SettingRow({ label, value, min, max, step, display, onDecrement, onIncrement, onChange, disabled }: SettingRowProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-teal-400 text-lg p-0"
            onClick={onDecrement}
            disabled={disabled || value <= min}
            aria-label="−"
          >
            −
          </Button>
          <span className="text-white font-bold font-mono text-lg min-w-[48px] text-center">
            {display}
          </span>
          <Button
            variant="ghost"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-teal-400 text-lg p-0"
            onClick={onIncrement}
            disabled={disabled || value >= max}
            aria-label="+"
          >
            +
          </Button>
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
        className="[&_.slider-track]:bg-slate-700 [&_.slider-range]:bg-teal-500"
      />
    </div>
  )
}

interface SettingsPanelProps {
  settings: HiitSettings
  isLocked: boolean
  onUpdate: <K extends keyof HiitSettings>(key: K, value: HiitSettings[K]) => void
}

export function SettingsPanel({ settings, isLocked, onUpdate }: SettingsPanelProps) {
  if (isLocked) {
    return (
      <div className="bg-slate-950 border-t border-slate-800 px-5 py-4 text-center">
        <p className="text-xs tracking-widest uppercase text-slate-600">
          Settings locked during workout
        </p>
      </div>
    )
  }

  return (
    <div className="bg-slate-950 border-t border-slate-800 px-5 pt-4 pb-5">
      <p className="text-xs font-bold tracking-widest uppercase text-teal-500 mb-4">SETTINGS</p>
      <SettingRow
        label="WORK"
        value={settings.workTime}
        min={5} max={300} step={5}
        display={formatTime(settings.workTime)}
        onDecrement={() => onUpdate('workTime', Math.max(5, settings.workTime - 5))}
        onIncrement={() => onUpdate('workTime', Math.min(300, settings.workTime + 5))}
        onChange={v => onUpdate('workTime', v)}
        disabled={false}
      />
      <SettingRow
        label="REST"
        value={settings.restTime}
        min={5} max={300} step={5}
        display={formatTime(settings.restTime)}
        onDecrement={() => onUpdate('restTime', Math.max(5, settings.restTime - 5))}
        onIncrement={() => onUpdate('restTime', Math.min(300, settings.restTime + 5))}
        onChange={v => onUpdate('restTime', v)}
        disabled={false}
      />
      <SettingRow
        label="ROUNDS"
        value={settings.rounds}
        min={1} max={20} step={1}
        display={String(settings.rounds)}
        onDecrement={() => onUpdate('rounds', Math.max(1, settings.rounds - 1))}
        onIncrement={() => onUpdate('rounds', Math.min(20, settings.rounds + 1))}
        onChange={v => onUpdate('rounds', v)}
        disabled={false}
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400">PREPARE DELAY</span>
        <Switch
          checked={settings.prepareDelay}
          onCheckedChange={v => onUpdate('prepareDelay', v)}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- --run src/components/SettingsPanel.test.tsx
```

Expected: all 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsPanel.tsx src/components/SettingsPanel.test.tsx
git commit -m "feat: SettingsPanel component"
```

---

## Task 8: App composition + global styles

**Files:**
- Modify: `src/App.tsx` (replace generated content)
- Modify: `src/index.css`

- [ ] **Step 1: Run all tests — verify full suite passes**

```bash
npm test -- --run
```

Expected: all tests PASS before touching App.tsx

- [ ] **Step 2: Replace `src/index.css`**

```css
@import "tailwindcss";

*, *::before, *::after {
  box-sizing: border-box;
}

html, body, #root {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background-color: #0d1b2a;
}
```

- [ ] **Step 3: Replace `src/App.tsx`**

```typescript
import { useHiitTimer } from '@/hooks/useHiitTimer'
import { TimerDisplay } from '@/components/TimerDisplay'
import { ProgressBar } from '@/components/ProgressBar'
import { ControlButtons } from '@/components/ControlButtons'
import { SettingsPanel } from '@/components/SettingsPanel'

function getPhaseTotalTime(phase: string, settings: { workTime: number; restTime: number }): number {
  if (phase === 'prep') return 5
  if (phase === 'work') return settings.workTime
  if (phase === 'rest') return settings.restTime
  return 0
}

export default function App() {
  const { phase, timeLeft, currentRound, settings, isRunning, start, pause, reset, updateSetting } = useHiitTimer()
  const isLocked = phase !== 'idle'
  const totalTime = getPhaseTotalTime(phase, settings)

  return (
    <div className="min-h-screen bg-[#0d1b2a] flex items-start justify-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen">
        <div className="bg-slate-950 px-5 py-4 text-center border-b border-slate-800">
          <h1 className="text-teal-400 font-extrabold text-sm tracking-[3px] uppercase">
            HIIT TIMER
          </h1>
        </div>
        <div className="flex-1 flex flex-col">
          <TimerDisplay
            phase={phase}
            timeLeft={timeLeft}
            currentRound={currentRound}
            totalRounds={settings.rounds}
          />
          <ProgressBar phase={phase} timeLeft={timeLeft} totalTime={totalTime} />
          <ControlButtons
            phase={phase}
            isRunning={isRunning}
            onStart={start}
            onPause={pause}
            onReset={reset}
          />
          <SettingsPanel
            settings={settings}
            isLocked={isLocked}
            onUpdate={updateSetting}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run dev server and visually verify**

```bash
npm run dev
```

Open `http://localhost:5173` and check:
- Dark navy background fills the screen
- "HIIT TIMER" header in teal
- `00:30` countdown, "READY" label, "4 ROUNDS"
- Settings panel visible with WORK / REST / ROUNDS sliders and PREPARE DELAY switch
- START button in teal, Reset (↺) disabled

Stop the server (`Ctrl+C`).

- [ ] **Step 5: Run full test suite — all pass**

```bash
npm test -- --run
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/index.css
git commit -m "feat: compose App with HIIT timer UI and dark navy theme"
```

---

## Task 9: End-to-end manual verification

Open `http://localhost:5173` with browser dev tools console visible.

- [ ] **Verify localStorage persistence:** Set WORK=45s, REST=20s, ROUNDS=6. Refresh the page. Values should still show 45s / 20s / 6.

- [ ] **Verify prepare delay:** With PREPARE DELAY on, press START. Phase label shows "GET READY", countdown shows 5 and ticks down. After 5s, transitions to WORK.

- [ ] **Verify voice cues:** With sound on in browser, listen for "3… 2… 1" in the last 3 seconds of prep, then "Work!" when WORK begins.

- [ ] **Verify full round cycle:** Let a work interval expire → REST phase turns blue → rest expires → WORK phase turns green, round increments to 2.

- [ ] **Verify done state:** Set ROUNDS=1, press START, let work interval complete. Phase shows "DONE!", then after 2s auto-resets to idle.

- [ ] **Verify pause/resume:** During WORK, press PAUSE. Countdown freezes. Press RESUME (same button). Countdown continues from same second.

- [ ] **Verify reset:** Mid-workout, press ↺. Returns to idle with original workTime, round 1. Reset button is now disabled.

- [ ] **Verify mobile layout:** Open Chrome DevTools → toggle device toolbar → iPhone SE (375×667). All controls visible, no horizontal scroll, buttons large enough to tap.

- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: final e2e verification complete"
```
