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
  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return
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

  // stateRef gives interval callbacks synchronous access to current state
  // without stale closures. Updated on every render.
  const stateRef = useRef(state)
  stateRef.current = state

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => () => {
    stopInterval()
    if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current)
  }, [stopInterval])

  const startInterval = useCallback(() => {
    stopInterval()
    intervalRef.current = setInterval(() => {
      const prev = stateRef.current
      if (!prev.isRunning) return

      const newTimeLeft = prev.timeLeft - 1
      if (newTimeLeft <= 3 && newTimeLeft > 0) {
        queueMicrotask(() => speak(String(newTimeLeft)))
      }

      const next: TimerState = newTimeLeft > 0
        ? { ...prev, timeLeft: newTimeLeft }
        : advancePhase(prev)

      stateRef.current = next
      setState(next)

      if (next.phase === 'done') {
        stopInterval()
        if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current)
        // Schedule synchronously so fake-timer advances in the same act() pick it up
        doneTimeoutRef.current = setTimeout(() => {
          doneTimeoutRef.current = null
          const resetState: TimerState = {
            ...stateRef.current,
            phase: 'idle',
            currentRound: 1,
            timeLeft: stateRef.current.settings.workTime,
            isRunning: false,
          }
          stateRef.current = resetState
          setState(resetState)
        }, 2000)
      }
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
    if (doneTimeoutRef.current) {
      clearTimeout(doneTimeoutRef.current)
      doneTimeoutRef.current = null
    }
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
