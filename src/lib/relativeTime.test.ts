import { describe, it, expect } from 'vitest'
import { formatRelative } from './relativeTime'

const NOW = 1_700_000_000_000
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

describe('formatRelative', () => {
  it('returns New when the workout has never been used', () => {
    expect(formatRelative(null, NOW)).toBe('New')
  })

  it('returns Just now under a minute', () => {
    expect(formatRelative(NOW - 30_000, NOW)).toBe('Just now')
  })

  it('returns minutes under an hour', () => {
    expect(formatRelative(NOW - 5 * MIN, NOW)).toBe('5m ago')
  })

  it('returns hours under a day', () => {
    expect(formatRelative(NOW - 2 * HOUR, NOW)).toBe('2h ago')
  })

  it('returns Yesterday at one day', () => {
    expect(formatRelative(NOW - DAY, NOW)).toBe('Yesterday')
  })

  it('returns days under a week', () => {
    expect(formatRelative(NOW - 3 * DAY, NOW)).toBe('3 days ago')
  })

  it('returns weeks under a month', () => {
    expect(formatRelative(NOW - 8 * DAY, NOW)).toBe('1 week ago')
    expect(formatRelative(NOW - 20 * DAY, NOW)).toBe('2 weeks ago')
  })

  it('returns months beyond thirty days', () => {
    expect(formatRelative(NOW - 40 * DAY, NOW)).toBe('1 month ago')
    expect(formatRelative(NOW - 200 * DAY, NOW)).toBe('6 months ago')
  })

  it('clamps a future timestamp to Just now rather than showing negatives', () => {
    expect(formatRelative(NOW + 10 * MIN, NOW)).toBe('Just now')
  })
})
