import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProgressBar } from './ProgressBar'

function getBar(container: HTMLElement) {
  return container.querySelector('[data-testid="progress-fill"]') as HTMLElement
}

describe('ProgressBar', () => {
  it('renders 0% width at start of interval', () => {
    const { container } = render(<ProgressBar phase="work" timeLeft={30} totalTime={30} />)
    expect(getBar(container).style.width).toBe('0%')
  })

  it('renders 50% width at half-way through interval', () => {
    const { container } = render(<ProgressBar phase="work" timeLeft={15} totalTime={30} />)
    expect(getBar(container).style.width).toBe('50%')
  })

  it('renders 100% width for done phase', () => {
    const { container } = render(<ProgressBar phase="done" timeLeft={0} totalTime={0} />)
    expect(getBar(container).style.width).toBe('100%')
  })

  it('renders 0% when totalTime is 0 and phase is idle', () => {
    const { container } = render(<ProgressBar phase="idle" timeLeft={30} totalTime={0} />)
    expect(getBar(container).style.width).toBe('0%')
  })
})
