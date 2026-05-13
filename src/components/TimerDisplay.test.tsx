import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TimerDisplay } from './TimerDisplay'

describe('TimerDisplay', () => {
  it('formats seconds under 60 as 0:SS', () => {
    render(<TimerDisplay phase="idle" timeLeft={30} currentRound={1} totalRounds={4} />)
    expect(screen.getByText('00:30')).toBeInTheDocument()
  })

  it('formats seconds ≥ 60 as M:SS', () => {
    render(<TimerDisplay phase="idle" timeLeft={90} currentRound={1} totalRounds={4} />)
    expect(screen.getByText('01:30')).toBeInTheDocument()
  })

  it('shows READY label when idle', () => {
    render(<TimerDisplay phase="idle" timeLeft={30} currentRound={1} totalRounds={4} />)
    expect(screen.getByText('READY')).toBeInTheDocument()
  })

  it('shows WORK label when in work phase', () => {
    render(<TimerDisplay phase="work" timeLeft={25} currentRound={2} totalRounds={4} />)
    expect(screen.getByText(/WORK/)).toBeInTheDocument()
  })

  it('shows REST label when in rest phase', () => {
    render(<TimerDisplay phase="rest" timeLeft={10} currentRound={1} totalRounds={4} />)
    expect(screen.getByText(/REST/)).toBeInTheDocument()
  })

  it('shows GET READY label when in prep phase', () => {
    render(<TimerDisplay phase="prep" timeLeft={5} currentRound={1} totalRounds={4} />)
    expect(screen.getByText(/GET READY/)).toBeInTheDocument()
  })

  it('shows round indicator when not idle', () => {
    render(<TimerDisplay phase="work" timeLeft={25} currentRound={2} totalRounds={4} />)
    expect(screen.getByText('ROUND 2 / 4')).toBeInTheDocument()
  })

  it('shows total rounds when idle', () => {
    render(<TimerDisplay phase="idle" timeLeft={30} currentRound={1} totalRounds={4} />)
    expect(screen.getByText('4 ROUNDS')).toBeInTheDocument()
  })
})
