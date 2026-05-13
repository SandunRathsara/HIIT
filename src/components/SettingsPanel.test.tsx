import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SettingsPanel } from './SettingsPanel'
import type { HiitSettings } from '@/hooks/useHiitTimer'

const defaultSettings: HiitSettings = {
  workTime: 30,
  restTime: 10,
  rounds: 4,
  prepareDelay: true,
}

describe('SettingsPanel', () => {
  it('shows settings when not locked', () => {
    render(<SettingsPanel settings={defaultSettings} isLocked={false} onUpdate={vi.fn()} />)
    expect(screen.getByText('WORK')).toBeInTheDocument()
    expect(screen.getByText('REST')).toBeInTheDocument()
    expect(screen.getByText('ROUNDS')).toBeInTheDocument()
    expect(screen.getByText('PREPARE DELAY')).toBeInTheDocument()
  })

  it('shows locked message instead of settings when locked', () => {
    render(<SettingsPanel settings={defaultSettings} isLocked={true} onUpdate={vi.fn()} />)
    expect(screen.getByText(/locked/i)).toBeInTheDocument()
    expect(screen.queryByText('WORK')).not.toBeInTheDocument()
  })

  it('calls onUpdate with incremented workTime when + clicked', async () => {
    const onUpdate = vi.fn()
    render(<SettingsPanel settings={defaultSettings} isLocked={false} onUpdate={onUpdate} />)
    const plusButtons = screen.getAllByRole('button', { name: '+' })
    await userEvent.click(plusButtons[0]) // first + is workTime
    expect(onUpdate).toHaveBeenCalledWith('workTime', 35)
  })

  it('calls onUpdate with decremented workTime when − clicked', async () => {
    const onUpdate = vi.fn()
    render(<SettingsPanel settings={defaultSettings} isLocked={false} onUpdate={onUpdate} />)
    const minusButtons = screen.getAllByRole('button', { name: '−' })
    await userEvent.click(minusButtons[0])
    expect(onUpdate).toHaveBeenCalledWith('workTime', 25)
  })

  it('calls onUpdate with new prepareDelay when switch toggled', async () => {
    const onUpdate = vi.fn()
    render(<SettingsPanel settings={defaultSettings} isLocked={false} onUpdate={onUpdate} />)
    const toggle = screen.getByRole('switch')
    await userEvent.click(toggle)
    expect(onUpdate).toHaveBeenCalledWith('prepareDelay', false)
  })

  it('displays formatted work time', () => {
    render(<SettingsPanel settings={{ ...defaultSettings, workTime: 90 }} isLocked={false} onUpdate={vi.fn()} />)
    expect(screen.getByText('1:30')).toBeInTheDocument()
  })

  it('displays rounds count', () => {
    render(<SettingsPanel settings={defaultSettings} isLocked={false} onUpdate={vi.fn()} />)
    expect(screen.getByText('4')).toBeInTheDocument()
  })
})
