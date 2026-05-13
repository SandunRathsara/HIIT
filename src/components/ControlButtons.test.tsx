import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ControlButtons } from './ControlButtons'
import type { Phase } from '@/hooks/useHiitTimer'

const noop = vi.fn()

function renderButtons(phase: Phase, isRunning: boolean) {
  return render(
    <ControlButtons
      phase={phase}
      isRunning={isRunning}
      onStart={noop}
      onPause={noop}
      onReset={noop}
    />
  )
}

describe('ControlButtons', () => {
  it('shows START when idle and not running', () => {
    renderButtons('idle', false)
    expect(screen.getByRole('button', { name: 'START' })).toBeInTheDocument()
  })

  it('shows PAUSE when running', () => {
    renderButtons('work', true)
    expect(screen.getByRole('button', { name: 'PAUSE' })).toBeInTheDocument()
  })

  it('shows RESUME when paused mid-workout', () => {
    renderButtons('work', false)
    expect(screen.getByRole('button', { name: 'RESUME' })).toBeInTheDocument()
  })

  it('reset button is disabled when idle', () => {
    renderButtons('idle', false)
    expect(screen.getByRole('button', { name: '↺' })).toBeDisabled()
  })

  it('reset button is enabled when running', () => {
    renderButtons('work', true)
    expect(screen.getByRole('button', { name: '↺' })).not.toBeDisabled()
  })

  it('calls onStart when START is clicked', async () => {
    const onStart = vi.fn()
    render(<ControlButtons phase="idle" isRunning={false} onStart={onStart} onPause={noop} onReset={noop} />)
    await userEvent.click(screen.getByRole('button', { name: 'START' }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('calls onPause when PAUSE is clicked', async () => {
    const onPause = vi.fn()
    render(<ControlButtons phase="work" isRunning={true} onStart={noop} onPause={onPause} onReset={noop} />)
    await userEvent.click(screen.getByRole('button', { name: 'PAUSE' }))
    expect(onPause).toHaveBeenCalledOnce()
  })

  it('calls onReset when ↺ is clicked', async () => {
    const onReset = vi.fn()
    render(<ControlButtons phase="work" isRunning={true} onStart={noop} onPause={noop} onReset={onReset} />)
    await userEvent.click(screen.getByRole('button', { name: '↺' }))
    expect(onReset).toHaveBeenCalledOnce()
  })
})
