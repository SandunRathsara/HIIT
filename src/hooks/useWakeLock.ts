import { useEffect, useRef } from 'react'

/**
 * Holds a screen wake lock while `active`. The browser drops the lock whenever
 * the page is hidden, so we re-acquire on visibilitychange. Silently does
 * nothing where the API is missing (older iOS, jsdom).
 */
export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    let cancelled = false

    async function acquire() {
      if (!active || cancelled) return
      if (!('wakeLock' in navigator) || !navigator.wakeLock) return
      if (document.visibilityState === 'hidden') return
      try {
        const s = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void s.release()
          return
        }
        sentinelRef.current = s
      } catch {
        // Denied (low battery, no user gesture) — not worth surfacing.
      }
    }

    async function release() {
      const sentinel = sentinelRef.current
      sentinelRef.current = null
      if (!sentinel) return
      try {
        await sentinel.release()
      } catch {
        // Already released.
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') void acquire()
    }

    if (active) {
      void acquire()
      document.addEventListener('visibilitychange', onVisibilityChange)
    } else {
      void release()
    }

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      void release()
    }
  }, [active])
}
