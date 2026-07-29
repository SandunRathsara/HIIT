import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TimerDisplay } from './TimerDisplay'
import type { PhaseView } from '@/lib/phaseView'

const workView: PhaseView = {
  label: 'WORK',
  kicker: null,
  ringText: 'BURPEES',
  subline: null,
  showsClock: true,
}

const repsView: PhaseView = {
  label: 'WORK',
  kicker: null,
  ringText: 'PUSH-UPS',
  subline: '15 REPS',
  showsClock: false,
}

describe('TimerDisplay', () => {
  it('shows the exercise and a padded countdown on a timed round', () => {
    render(
      <TimerDisplay
        phase="work"
        view={workView}
        timeLeft={27}
        elapsed={0}
        repsTarget={null}
        currentRound={3}
        totalRounds={8}
        phaseTotal={40}
      />,
    )

    expect(screen.getByText('BURPEES')).toBeInTheDocument()
    expect(screen.getByText('00:27')).toBeInTheDocument()
    expect(screen.getByText('Round 3 / 8')).toBeInTheDocument()
  })

  it('shows the rep target and count-up elapsed on a reps round', () => {
    render(
      <TimerDisplay
        phase="work"
        view={repsView}
        timeLeft={0}
        elapsed={23}
        repsTarget={15}
        currentRound={2}
        totalRounds={4}
        phaseTotal={0}
      />,
    )

    expect(screen.getByText('PUSH-UPS')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('00:23 elapsed')).toBeInTheDocument()
    expect(screen.getByText('15 REPS')).toBeInTheDocument()
  })

  it('renders the NEXT kicker during rest', () => {
    render(
      <TimerDisplay
        phase="rest"
        view={{ label: 'REST', kicker: 'NEXT', ringText: 'PLANK', subline: '60s', showsClock: true }}
        timeLeft={12}
        elapsed={0}
        repsTarget={null}
        currentRound={3}
        totalRounds={8}
        phaseTotal={20}
      />,
    )

    expect(screen.getByText('NEXT')).toBeInTheDocument()
    expect(screen.getByText('PLANK')).toBeInTheDocument()
  })

  it('renders the cool-down copy', () => {
    render(
      <TimerDisplay
        phase="cooldown"
        view={{
          label: 'COOL DOWN',
          kicker: null,
          ringText: 'WALK IT OFF',
          subline: "Keep moving — don't sit down",
          showsClock: true,
        }}
        timeLeft={47}
        elapsed={0}
        repsTarget={null}
        currentRound={8}
        totalRounds={8}
        phaseTotal={60}
      />,
    )

    expect(screen.getByText('WALK IT OFF')).toBeInTheDocument()
    expect(screen.getByText("Keep moving — don't sit down")).toBeInTheDocument()
  })
})
