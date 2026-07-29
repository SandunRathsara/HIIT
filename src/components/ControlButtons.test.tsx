import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ControlButtons } from './ControlButtons'

function setup(overrides: Partial<Parameters<typeof ControlButtons>[0]> = {}) {
  const props = {
    phase: 'work' as const,
    isRunning: true,
    isRepsRound: false,
    onResume: vi.fn(),
    onPause: vi.fn(),
    onCompleteReps: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  }
  render(<ControlButtons {...props} />)
  return props
}

describe('ControlButtons', () => {
  it('shows PAUSE while a timed round is running', () => {
    setup()

    expect(screen.getByRole('button', { name: 'PAUSE' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'DONE' })).not.toBeInTheDocument()
  })

  it('shows RESUME when paused', () => {
    setup({ isRunning: false })

    expect(screen.getByRole('button', { name: 'RESUME' })).toBeInTheDocument()
  })

  it('replaces the primary button with DONE on a reps round', () => {
    setup({ isRepsRound: true })

    expect(screen.getByRole('button', { name: 'DONE' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'PAUSE' })).not.toBeInTheDocument()
  })

  it('calls completeReps when DONE is tapped', async () => {
    const props = setup({ isRepsRound: true })

    await userEvent.click(screen.getByRole('button', { name: 'DONE' }))

    expect(props.onCompleteReps).toHaveBeenCalledOnce()
  })

  it('always offers RESET', async () => {
    const props = setup()

    await userEvent.click(screen.getByRole('button', { name: 'RESET' }))

    expect(props.onReset).toHaveBeenCalledOnce()
  })
})
