import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useWorkoutTimer } from './useWorkoutTimer'
import type { Round, Workout } from '@/db/schema'

function round(partial: Partial<Round> & { order: number }): Round {
  return {
    exercise: `Ex${partial.order}`,
    mode: 'time',
    value: 10,
    secondsPerRep: 3,
    restTime: 5,
    ...partial,
  }
}

function workout(partial: Partial<Workout> = {}): Workout {
  return {
    id: 1,
    name: 'Test',
    prepareDelay: true,
    prepareSeconds: 5,
    rounds: [round({ order: 1 }), round({ order: 2 })],
    createdAt: 0,
    lastUsedAt: null,
    ...partial,
  }
}

/** Advance the fake clock by whole seconds inside act(). */
function tick(seconds: number) {
  act(() => {
    vi.advanceTimersByTime(seconds * 1000)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: vi.fn() })
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      text: string
      constructor(text: string) {
        this.text = text
      }
    },
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useWorkoutTimer', () => {
  it('starts idle with the first round loaded', () => {
    const { result } = renderHook(() => useWorkoutTimer(workout()))

    expect(result.current.phase).toBe('idle')
    expect(result.current.roundIndex).toBe(0)
    expect(result.current.isRunning).toBe(false)
    expect(result.current.currentRound?.order).toBe(1)
  })

  it('enters prep for prepareSeconds when the prepare delay is on', () => {
    const { result } = renderHook(() => useWorkoutTimer(workout({ prepareSeconds: 15 })))

    act(() => result.current.start())

    expect(result.current.phase).toBe('prep')
    expect(result.current.timeLeft).toBe(15)
    expect(result.current.isRunning).toBe(true)
  })

  it('skips straight to work when the prepare delay is off', () => {
    const { result } = renderHook(() => useWorkoutTimer(workout({ prepareDelay: false })))

    act(() => result.current.start())

    expect(result.current.phase).toBe('work')
    expect(result.current.timeLeft).toBe(10)
  })

  it('moves prep to work when it runs out', () => {
    const { result } = renderHook(() => useWorkoutTimer(workout({ prepareSeconds: 5 })))

    act(() => result.current.start())
    tick(5)

    expect(result.current.phase).toBe('work')
    expect(result.current.roundIndex).toBe(0)
    expect(result.current.timeLeft).toBe(10)
  })

  it('moves a timed round to rest and then to the next round', () => {
    const { result } = renderHook(() => useWorkoutTimer(workout({ prepareDelay: false })))

    act(() => result.current.start())
    tick(10)
    expect(result.current.phase).toBe('rest')
    expect(result.current.timeLeft).toBe(5)
    expect(result.current.nextRound?.order).toBe(2)

    tick(5)
    expect(result.current.phase).toBe('work')
    expect(result.current.roundIndex).toBe(1)
  })

  it('skips rest entirely when restTime is 0', () => {
    const w = workout({
      prepareDelay: false,
      rounds: [round({ order: 1, restTime: 0 }), round({ order: 2 })],
    })
    const { result } = renderHook(() => useWorkoutTimer(w))

    act(() => result.current.start())
    tick(10)

    expect(result.current.phase).toBe('work')
    expect(result.current.roundIndex).toBe(1)
  })

  it('runs the final rest as a cooldown and then finishes', () => {
    const { result } = renderHook(() => useWorkoutTimer(workout({ prepareDelay: false })))

    act(() => result.current.start())
    tick(10 + 5 + 10) // round 1, rest, round 2

    expect(result.current.phase).toBe('cooldown')
    expect(result.current.timeLeft).toBe(5)

    tick(5)
    expect(result.current.phase).toBe('done')
    expect(result.current.isRunning).toBe(false)
  })

  it('finishes immediately when the last round has no rest', () => {
    const w = workout({
      prepareDelay: false,
      rounds: [round({ order: 1, restTime: 0 })],
    })
    const { result } = renderHook(() => useWorkoutTimer(w))

    act(() => result.current.start())
    tick(10)

    expect(result.current.phase).toBe('done')
  })

  it('does not auto-reset after finishing', () => {
    const w = workout({ prepareDelay: false, rounds: [round({ order: 1, restTime: 0 })] })
    const { result } = renderHook(() => useWorkoutTimer(w))

    act(() => result.current.start())
    tick(10)
    tick(30)

    expect(result.current.phase).toBe('done')
  })

  it('holds a reps round open and counts elapsed upward', () => {
    const w = workout({
      prepareDelay: false,
      rounds: [round({ order: 1, mode: 'reps', value: 15 }), round({ order: 2 })],
    })
    const { result } = renderHook(() => useWorkoutTimer(w))

    act(() => result.current.start())
    expect(result.current.isRepsRound).toBe(true)
    expect(result.current.phaseTotal).toBe(0)

    tick(30)
    expect(result.current.phase).toBe('work')
    expect(result.current.elapsed).toBe(30)
  })

  it('advances a reps round only when completeReps is called', () => {
    const w = workout({
      prepareDelay: false,
      rounds: [round({ order: 1, mode: 'reps', value: 15 }), round({ order: 2 })],
    })
    const { result } = renderHook(() => useWorkoutTimer(w))

    act(() => result.current.start())
    tick(3)
    act(() => result.current.completeReps())

    expect(result.current.phase).toBe('rest')
  })

  it('ignores completeReps during a timed round', () => {
    const { result } = renderHook(() => useWorkoutTimer(workout({ prepareDelay: false })))

    act(() => result.current.start())
    act(() => result.current.completeReps())

    expect(result.current.phase).toBe('work')
    expect(result.current.timeLeft).toBe(10)
  })

  it('pauses and resumes from the same second', () => {
    const { result } = renderHook(() => useWorkoutTimer(workout({ prepareDelay: false })))

    act(() => result.current.start())
    tick(3)
    act(() => result.current.pause())
    tick(10)

    expect(result.current.timeLeft).toBe(7)
    expect(result.current.isRunning).toBe(false)

    act(() => result.current.start())
    tick(2)
    expect(result.current.timeLeft).toBe(5)
  })

  it('resets back to idle', () => {
    const { result } = renderHook(() => useWorkoutTimer(workout({ prepareDelay: false })))

    act(() => result.current.start())
    tick(12)
    act(() => result.current.reset())

    expect(result.current.phase).toBe('idle')
    expect(result.current.roundIndex).toBe(0)
    expect(result.current.isRunning).toBe(false)
    expect(result.current.totalElapsed).toBe(0)
  })

  it('accumulates totalElapsed only while running', () => {
    const { result } = renderHook(() => useWorkoutTimer(workout({ prepareDelay: false })))

    act(() => result.current.start())
    tick(4)
    act(() => result.current.pause())
    tick(10)

    expect(result.current.totalElapsed).toBe(4)
  })

  it('speaks the exercise on each transition', () => {
    const speakSpy = vi.fn()
    vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: speakSpy })
    const { result } = renderHook(() => useWorkoutTimer(workout({ prepareDelay: false })))

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(0))
    expect(speakSpy.mock.calls.at(-1)?.[0].text).toBe('Ex1!')

    tick(10)
    act(() => vi.advanceTimersByTime(0))
    expect(speakSpy.mock.calls.at(-1)?.[0].text).toBe('Rest. Next, Ex2.')
  })

  it('speaks a 3-2-1 countdown on timed phases', () => {
    const speakSpy = vi.fn()
    vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: speakSpy })
    const { result } = renderHook(() => useWorkoutTimer(workout({ prepareDelay: false })))

    act(() => result.current.start())
    tick(7)
    act(() => vi.advanceTimersByTime(0))

    expect(speakSpy.mock.calls.at(-1)?.[0].text).toBe('3')
  })

  it('reports phaseTotal for the ring on each timed phase', () => {
    const { result } = renderHook(() => useWorkoutTimer(workout({ prepareSeconds: 5 })))

    act(() => result.current.start())
    expect(result.current.phaseTotal).toBe(5)

    tick(5)
    expect(result.current.phaseTotal).toBe(10)

    tick(10)
    expect(result.current.phaseTotal).toBe(5)
  })

  it('stays idle when the workout has no rounds', () => {
    const { result } = renderHook(() => useWorkoutTimer(workout({ rounds: [] })))

    act(() => result.current.start())

    expect(result.current.phase).toBe('idle')
  })
})
