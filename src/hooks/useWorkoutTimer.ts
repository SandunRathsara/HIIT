import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Round, Workout } from '@/db/schema'
import { buildCue, speak, type CueEvent } from '@/lib/cues'

export type Phase = 'idle' | 'prep' | 'work' | 'rest' | 'cooldown' | 'done'

interface TimerState {
  phase: Phase
  roundIndex: number
  /** Counts down on timed phases. Always 0 during a reps round. */
  timeLeft: number
  /** Counts up during a reps round only. */
  elapsed: number
  /** Seconds spent running across the whole workout; excludes paused time. */
  totalElapsed: number
  isRunning: boolean
}

const IDLE: TimerState = {
  phase: 'idle',
  roundIndex: 0,
  timeLeft: 0,
  elapsed: 0,
  totalElapsed: 0,
  isRunning: false,
}

type Announce = (event: CueEvent) => void

/**
 * Deferred so speech never runs inside a React state updater — start() and
 * completeReps() call this from inside a setState functional updater, and
 * React's StrictMode double-invokes those in development, which would
 * otherwise speak every cue twice.
 */
function cue(event: CueEvent) {
  setTimeout(() => speak(buildCue(event)), 0)
}

/**
 * The recurring interval tick (see startInterval below) is a plain
 * setInterval callback, not a setState updater, so it can announce
 * synchronously — and must, since a cue queued for later during the very
 * last tick of a run (e.g. a phase transition landing exactly on the second
 * requested by a test's advanceTimersByTime) is not guaranteed to be
 * flushable by a subsequent zero-length tick.
 */
function cueNow(event: CueEvent) {
  speak(buildCue(event))
}

function isRepsRoundAt(workout: Workout, index: number): boolean {
  return workout.rounds[index]?.mode === 'reps'
}

/** Enter the work phase of `index`, announcing it. */
function enterWork(prev: TimerState, workout: Workout, index: number, announce: Announce): TimerState {
  const round = workout.rounds[index]
  announce({ type: 'work', round })
  return {
    ...prev,
    phase: 'work',
    roundIndex: index,
    timeLeft: round.mode === 'time' ? round.value : 0,
    elapsed: 0,
  }
}

/** Leave the work phase of `roundIndex`: rest, cooldown, next round, or done. */
function leaveWork(prev: TimerState, workout: Workout, announce: Announce): TimerState {
  const index = prev.roundIndex
  const round = workout.rounds[index]
  const isLast = index === workout.rounds.length - 1

  if (isLast) {
    if (round.restTime > 0) {
      announce({ type: 'cooldown' })
      return { ...prev, phase: 'cooldown', timeLeft: round.restTime, elapsed: 0 }
    }
    announce({ type: 'done' })
    return { ...prev, phase: 'done', timeLeft: 0, elapsed: 0, isRunning: false }
  }

  if (round.restTime > 0) {
    announce({ type: 'rest', nextRound: workout.rounds[index + 1] })
    return { ...prev, phase: 'rest', timeLeft: round.restTime, elapsed: 0 }
  }

  return enterWork(prev, workout, index + 1, announce)
}

/** What happens when a countdown hits zero. Always interval-driven, so announces immediately. */
function advance(prev: TimerState, workout: Workout): TimerState {
  switch (prev.phase) {
    case 'prep':
      return enterWork(prev, workout, 0, cueNow)
    case 'work':
      return leaveWork(prev, workout, cueNow)
    case 'rest':
      return enterWork(prev, workout, prev.roundIndex + 1, cueNow)
    case 'cooldown':
      cueNow({ type: 'done' })
      return { ...prev, phase: 'done', timeLeft: 0, isRunning: false }
    default:
      return prev
  }
}

export function useWorkoutTimer(workout: Workout) {
  const [state, setState] = useState<TimerState>(IDLE)

  // stateRef gives the interval callback synchronous access to current state
  // without stale closures. Synced right after every commit — well before the
  // 1s-granularity interval tick could ever observe a stale value.
  const stateRef = useRef(state)
  useLayoutEffect(() => {
    stateRef.current = state
  }, [state])

  const workoutRef = useRef(workout)
  useLayoutEffect(() => {
    workoutRef.current = workout
  }, [workout])

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => stopInterval, [stopInterval])

  const startInterval = useCallback(() => {
    stopInterval()
    intervalRef.current = setInterval(() => {
      const prev = stateRef.current
      const w = workoutRef.current
      if (!prev.isRunning) return

      const ticked: TimerState = { ...prev, totalElapsed: prev.totalElapsed + 1 }

      // Reps rounds are untimed — count up and wait for completeReps().
      if (prev.phase === 'work' && isRepsRoundAt(w, prev.roundIndex)) {
        const next = { ...ticked, elapsed: prev.elapsed + 1 }
        stateRef.current = next
        setState(next)
        return
      }

      const timeLeft = prev.timeLeft - 1
      if (timeLeft <= 3 && timeLeft > 0) cueNow({ type: 'countdown', seconds: timeLeft })

      const next = timeLeft > 0 ? { ...ticked, timeLeft } : advance(ticked, w)
      stateRef.current = next
      setState(next)

      if (next.phase === 'done') stopInterval()
    }, 1000)
  }, [stopInterval])

  const start = useCallback(() => {
    const w = workoutRef.current
    if (w.rounds.length === 0) return

    setState(prev => {
      if (prev.phase === 'done') return prev
      if (prev.phase !== 'idle') return { ...prev, isRunning: true }

      const fresh: TimerState = { ...IDLE, isRunning: true }
      if (w.prepareDelay) {
        cue({ type: 'prep', round: w.rounds[0] })
        return { ...fresh, phase: 'prep', timeLeft: w.prepareSeconds }
      }
      return enterWork(fresh, w, 0, cue)
    })

    startInterval()
  }, [startInterval])

  const pause = useCallback(() => {
    stopInterval()
    setState(prev => ({ ...prev, isRunning: false }))
  }, [stopInterval])

  const completeReps = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'work') return prev
      if (!isRepsRoundAt(workoutRef.current, prev.roundIndex)) return prev
      const next = leaveWork(prev, workoutRef.current, cue)
      if (next.phase === 'done') stopInterval()
      return next
    })
  }, [stopInterval])

  const reset = useCallback(() => {
    stopInterval()
    setState(IDLE)
  }, [stopInterval])

  const currentRound: Round | null = workout.rounds[state.roundIndex] ?? null
  const nextRound: Round | null = workout.rounds[state.roundIndex + 1] ?? null
  const isRepsRound = state.phase === 'work' && currentRound?.mode === 'reps'

  const phaseTotal =
    state.phase === 'prep' ? workout.prepareSeconds
      : state.phase === 'work' ? (currentRound?.mode === 'time' ? currentRound.value : 0)
      : state.phase === 'rest' || state.phase === 'cooldown' ? (currentRound?.restTime ?? 0)
      : 0

  return {
    phase: state.phase,
    roundIndex: state.roundIndex,
    currentRound,
    nextRound,
    timeLeft: state.timeLeft,
    elapsed: state.elapsed,
    totalElapsed: state.totalElapsed,
    isRunning: state.isRunning,
    isRepsRound,
    phaseTotal,
    start,
    pause,
    completeReps,
    reset,
  }
}

export type WorkoutTimer = ReturnType<typeof useWorkoutTimer>
