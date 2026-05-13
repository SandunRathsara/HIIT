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
