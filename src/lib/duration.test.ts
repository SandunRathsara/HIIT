import { describe, it, expect } from 'vitest'
import {
  roundWorkSeconds,
  estimateWorkoutSeconds,
  formatClock,
  formatCountdown,
  rangeLabel,
  workRangeLabel,
  restRangeLabel,
  roundTargetLabel,
  roundExerciseLabel,
} from './duration'
import type { Round } from '@/db/schema'

function timed(value: number, restTime = 20, exercise = 'Burpees'): Round {
  return { order: 1, exercise, mode: 'time', value, secondsPerRep: 3, restTime }
}

function reps(value: number, restTime = 20, secondsPerRep = 3, exercise = 'Push-ups'): Round {
  return { order: 2, exercise, mode: 'reps', value, secondsPerRep, restTime }
}

describe('roundWorkSeconds', () => {
  it('returns the value directly for a timed round', () => {
    expect(roundWorkSeconds(timed(40))).toBe(40)
  })

  it('multiplies reps by the pace for a reps round', () => {
    expect(roundWorkSeconds(reps(15, 20, 3))).toBe(45)
  })

  it('honours an overridden pace', () => {
    expect(roundWorkSeconds(reps(10, 20, 5))).toBe(50)
  })
})

describe('estimateWorkoutSeconds', () => {
  it('sums prep, every round and every rest', () => {
    // 10 prep + (40 + 20) + (15*3 + 60) = 175
    expect(
      estimateWorkoutSeconds({
        prepareDelay: true,
        prepareSeconds: 10,
        rounds: [timed(40, 20), reps(15, 60)],
      }),
    ).toBe(175)
  })

  it('omits prep when the prepare delay is off', () => {
    expect(
      estimateWorkoutSeconds({
        prepareDelay: false,
        prepareSeconds: 10,
        rounds: [timed(40, 20)],
      }),
    ).toBe(60)
  })

  it('returns 0 for a workout with no rounds and no prep', () => {
    expect(
      estimateWorkoutSeconds({ prepareDelay: false, prepareSeconds: 5, rounds: [] }),
    ).toBe(0)
  })
})

describe('formatClock', () => {
  it('formats minutes without zero padding', () => {
    expect(formatClock(560)).toBe('9:20')
  })

  it('pads seconds', () => {
    expect(formatClock(65)).toBe('1:05')
  })

  it('handles zero', () => {
    expect(formatClock(0)).toBe('0:00')
  })

  it('handles durations over an hour as plain minutes', () => {
    expect(formatClock(3_665)).toBe('61:05')
  })
})

describe('formatCountdown', () => {
  it('zero-pads both parts', () => {
    expect(formatCountdown(27)).toBe('00:27')
    expect(formatCountdown(65)).toBe('01:05')
    expect(formatCountdown(0)).toBe('00:00')
  })
})

describe('rangeLabel', () => {
  it('returns an em dash for an empty list', () => {
    expect(rangeLabel([], 's')).toBe('—')
  })

  it('returns a single value when they all match', () => {
    expect(rangeLabel([40, 40, 40], 's')).toBe('40s')
  })

  it('returns min–max when they differ', () => {
    expect(rangeLabel([60, 30, 45], 's')).toBe('30–60s')
  })
})

describe('workRangeLabel', () => {
  it('considers only timed rounds', () => {
    expect(workRangeLabel([timed(30), reps(15), timed(60)])).toBe('30–60s')
  })

  it('returns an em dash when every round is reps-based', () => {
    expect(workRangeLabel([reps(15), reps(20)])).toBe('—')
  })
})

describe('restRangeLabel', () => {
  it('includes every round', () => {
    expect(restRangeLabel([timed(40, 15), reps(15, 60)])).toBe('15–60s')
  })
})

describe('roundTargetLabel', () => {
  it('labels a timed round in seconds', () => {
    expect(roundTargetLabel(timed(40))).toBe('40s')
  })

  it('labels a reps round with a count', () => {
    expect(roundTargetLabel(reps(15))).toBe('15 REPS')
  })

  it('uses the singular for one rep', () => {
    expect(roundTargetLabel(reps(1))).toBe('1 REP')
  })
})

describe('roundExerciseLabel', () => {
  it('uses the exercise name when present', () => {
    expect(roundExerciseLabel(timed(40, 20, 'Burpees'))).toBe('Burpees')
  })

  it('falls back to the round number when blank', () => {
    expect(roundExerciseLabel({ ...timed(40), order: 3, exercise: '   ' })).toBe('ROUND 3')
  })
})
