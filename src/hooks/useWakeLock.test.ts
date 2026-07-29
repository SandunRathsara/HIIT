import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useWakeLock } from './useWakeLock'

const release = vi.fn()
const request = vi.fn()

beforeEach(() => {
  release.mockReset().mockResolvedValue(undefined)
  request.mockReset().mockResolvedValue({ release, addEventListener: vi.fn() })
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useWakeLock', () => {
  it('requests a screen wake lock when it becomes active', async () => {
    renderHook(() => useWakeLock(true))

    await waitFor(() => expect(request).toHaveBeenCalledWith('screen'))
  })

  it('does not request one while inactive', () => {
    renderHook(() => useWakeLock(false))

    expect(request).not.toHaveBeenCalled()
  })

  it('releases the lock when it goes inactive', async () => {
    const { rerender } = renderHook(({ active }) => useWakeLock(active), {
      initialProps: { active: true },
    })
    await waitFor(() => expect(request).toHaveBeenCalled())

    rerender({ active: false })

    await waitFor(() => expect(release).toHaveBeenCalled())
  })

  it('releases the lock on unmount', async () => {
    const { unmount } = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(request).toHaveBeenCalled())

    unmount()

    await waitFor(() => expect(release).toHaveBeenCalled())
  })

  it('re-acquires the lock when the page becomes visible again', async () => {
    renderHook(() => useWakeLock(true))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
  })

  it('does nothing where the API is unavailable', () => {
    Object.defineProperty(navigator, 'wakeLock', { value: undefined, configurable: true })

    expect(() => renderHook(() => useWakeLock(true))).not.toThrow()
  })
})
