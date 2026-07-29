import { describe, it, expect } from 'vitest'
import { describePhase } from './phaseView'
import type { Round } from '@/db/schema'

function timed(order: number, exercise: string): Round {
  return { order, exercise, mode: 'time', value: 40, secondsPerRep: 3, restTime: 20 }
}

function reps(order: number, exercise: string, value = 15): Round {
  return { order, exercise, mode: 'reps', value, secondsPerRep: 3, restTime: 20 }
}

describe('describePhase', () => {
  it('describes prep with the first exercise as the subline', () => {
    const view = describePhase({
      phase: 'prep',
      currentRound: timed(1, 'Burpees'),
      nextRound: timed(2, 'Push-ups'),
    })

    expect(view.label).toBe('GET READY')
    expect(view.ringText).toBe('GET READY')
    expect(view.subline).toBe('Burpees')
    expect(view.showsClock).toBe(true)
  })

  it('describes a timed work round', () => {
    const view = describePhase({
      phase: 'work',
      currentRound: timed(1, 'Burpees'),
      nextRound: timed(2, 'Push-ups'),
    })

    expect(view.label).toBe('WORK')
    expect(view.kicker).toBeNull()
    expect(view.ringText).toBe('BURPEES')
    expect(view.subline).toBeNull()
  })

  it('falls back to the round number for an unnamed round', () => {
    const view = describePhase({
      phase: 'work',
      currentRound: timed(3, ''),
      nextRound: null,
    })

    expect(view.ringText).toBe('ROUND 3')
  })

  it('describes a reps work round with the target as the subline', () => {
    const view = describePhase({
      phase: 'work',
      currentRound: reps(2, 'Push-ups', 15),
      nextRound: null,
    })

    expect(view.ringText).toBe('PUSH-UPS')
    expect(view.subline).toBe('15 REPS')
    expect(view.showsClock).toBe(false)
  })

  it('describes rest as a preview of the next round', () => {
    const view = describePhase({
      phase: 'rest',
      currentRound: timed(1, 'Burpees'),
      nextRound: reps(2, 'Push-ups', 15),
    })

    expect(view.label).toBe('REST')
    expect(view.kicker).toBe('NEXT')
    expect(view.ringText).toBe('PUSH-UPS')
    expect(view.subline).toBe('15 REPS')
  })

  it('uses the fixed cool-down copy', () => {
    const view = describePhase({
      phase: 'cooldown',
      currentRound: timed(8, 'Plank'),
      nextRound: null,
    })

    expect(view.label).toBe('COOL DOWN')
    expect(view.kicker).toBeNull()
    expect(view.ringText).toBe('WALK IT OFF')
    expect(view.subline).toBe("Keep moving — don't sit down")
  })

  it('describes idle and done without a round', () => {
    expect(describePhase({ phase: 'idle', currentRound: null, nextRound: null }).label).toBe('READY')
    expect(describePhase({ phase: 'done', currentRound: null, nextRound: null }).label).toBe('COMPLETE')
  })
})
