import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RoundCard, type RoundDraft } from './RoundCard'
import { DEFAULT_ROUND } from '@/db/schema'

function setup(overrides: Partial<RoundDraft> = {}) {
  const onRemove = vi.fn()
  let draft: RoundDraft = {
    key: 1,
    ...DEFAULT_ROUND,
    ...overrides,
  }
  const onChange = vi.fn((next: RoundDraft) => {
    draft = next
    rerender(
      <RoundCard
        draft={draft}
        index={0}
        canRemove
        onChange={onChange}
        onRemove={onRemove}
      />,
    )
  })

  const { rerender } = render(
    <RoundCard
      draft={draft}
      index={0}
      canRemove
      onChange={onChange}
      onRemove={onRemove}
    />,
  )

  return { draft, onChange, onRemove }
}

describe('RoundCard', () => {
  it('scopes the mode control and time presets to the Work section', () => {
    setup()

    const work = screen.getByRole('region', { name: 'Work' })
    const rest = screen.getByRole('region', { name: 'Rest' })

    expect(within(work).getByRole('group', { name: 'Round 1 work mode' })).toBeInTheDocument()
    expect(within(work).getByRole('button', { name: '45s', pressed: true })).toBeInTheDocument()
    expect(within(rest).getByRole('button', { name: '20s', pressed: true })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Increase Pace' })).not.toBeInTheDocument()
  })

  it('shows Pace only in Reps mode and keeps Rest available', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: 'Reps' }))

    expect(screen.getByRole('button', { name: 'Increase Pace' })).toBeInTheDocument()
    const rest = screen.getByRole('region', { name: 'Rest' })
    expect(rest).toBeInTheDocument()
    expect(within(rest).getByRole('button', { name: '20s', pressed: true })).toBeInTheDocument()
  })

  it('renders the approved preset values', () => {
    setup()

    const work = screen.getByRole('region', { name: 'Work' })
    const rest = screen.getByRole('region', { name: 'Rest' })

    expect(within(work).getByRole('button', { name: '30s' })).toBeInTheDocument()
    expect(within(work).getByRole('button', { name: '45s' })).toBeInTheDocument()
    expect(within(work).getByRole('button', { name: '60s' })).toBeInTheDocument()
    expect(within(rest).getByRole('button', { name: '10s' })).toBeInTheDocument()
    expect(within(rest).getByRole('button', { name: '20s' })).toBeInTheDocument()
  })
})
