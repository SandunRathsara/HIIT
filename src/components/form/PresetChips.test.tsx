import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PresetChips } from './PresetChips'

describe('PresetChips', () => {
  it('distributes preset buttons evenly across the available row', () => {
    render(
      <PresetChips
        label="Work"
        values={[30, 45, 60]}
        value={45}
        format={value => `${value}s`}
        onSelect={() => {}}
      />,
    )

    const group = screen.getByRole('group', { name: 'Work presets' })
    expect(group).toHaveClass('flex', 'w-full', 'flex-nowrap')

    const buttons = within(group).getAllByRole('button')
    expect(buttons).toHaveLength(3)
    buttons.forEach(button => expect(button).toHaveClass('flex-1', 'min-w-0'))
  })
})
