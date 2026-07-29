import { describe, it, expect } from 'vitest'
import { buildCue } from './cues'
import type { Round } from '@/db/schema'

function timed(exercise: string): Round {
  return { order: 1, exercise, mode: 'time', value: 40, secondsPerRep: 3, restTime: 20 }
}

function reps(exercise: string, value: number): Round {
  return { order: 2, exercise, mode: 'reps', value, secondsPerRep: 3, restTime: 20 }
}

describe('buildCue', () => {
  it('announces the first exercise on prep', () => {
    expect(buildCue({ type: 'prep', round: timed('Burpees') })).toBe('Get ready. Burpees.')
  })

  it('falls back to a bare Get ready when the first round is unnamed', () => {
    expect(buildCue({ type: 'prep', round: timed('') })).toBe('Get ready.')
  })

  it('shouts a timed exercise', () => {
    expect(buildCue({ type: 'work', round: timed('Burpees') })).toBe('Burpees!')
  })

  it('falls back to Work for an unnamed timed round', () => {
    expect(buildCue({ type: 'work', round: timed('  ') })).toBe('Work!')
  })

  it('announces the target on a reps round', () => {
    expect(buildCue({ type: 'work', round: reps('Push-ups', 15) })).toBe('Push-ups. 15 reps.')
  })

  it('uses the singular for a single rep', () => {
    expect(buildCue({ type: 'work', round: reps('Pull-up', 1) })).toBe('Pull-up. 1 rep.')
  })

  it('announces reps without a name', () => {
    expect(buildCue({ type: 'work', round: reps('', 20) })).toBe('20 reps.')
  })

  it('announces what is coming next on rest', () => {
    expect(buildCue({ type: 'rest', nextRound: timed('Push-ups') })).toBe('Rest. Next, Push-ups.')
  })

  it('falls back to a bare Rest when the next round is unnamed', () => {
    expect(buildCue({ type: 'rest', nextRound: timed('') })).toBe('Rest.')
  })

  it('has fixed copy for cool down and completion', () => {
    expect(buildCue({ type: 'cooldown' })).toBe('Cool down. Walk it off.')
    expect(buildCue({ type: 'done' })).toBe('Workout complete!')
  })

  it('speaks bare numbers for the countdown', () => {
    expect(buildCue({ type: 'countdown', seconds: 3 })).toBe('3')
  })
})
