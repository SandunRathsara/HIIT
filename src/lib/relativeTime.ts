const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** `now` is a parameter so the output is testable without mocking the clock. */
export function formatRelative(timestamp: number | null, now: number): string {
  if (timestamp === null) return 'New'

  const diff = Math.max(0, now - timestamp)
  if (diff < MINUTE) return 'Just now'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`

  const days = Math.floor(diff / DAY)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`

  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  }

  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}
