# Equal-Width Preset Buttons Implementation Plan

> **For agentic workers:** Implement this plan task-by-task. Use the test-first cycle described below. Do not commit unless the user explicitly requests a commit.

**Goal:** Make the Prepare delay, Work, and Rest preset buttons share the available row width equally.

**Architecture:** Update the shared `PresetChips` presentational component rather than its three call sites. Keep the existing button behavior and visual styling, changing only the container wrapping and button flex sizing. Add a focused component test that locks the layout class contract.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind CSS v4, Vitest 4, Testing Library, pnpm.

## Global Constraints

- Preserve the existing labels, active states, click behavior, colors, spacing, focus styles, and 44px minimum touch height.
- Keep the preset buttons in one non-wrapping row at the supported mobile width.
- Use `flex: 1` sizing for every preset button.
- Do not change `RoundCard` or `CreateWorkoutScreen` call-site behavior.
- Do not add dependencies.

---

### Task 1: Equal-Width PresetChips Layout

**Files:**
- Create: `src/components/form/PresetChips.test.tsx`
- Modify: `src/components/form/PresetChips.tsx:13-30`

**Interfaces:**
- Consumes: Existing `PresetChipsProps` and `PresetChips` rendering contract.
- Produces: A full-width, non-wrapping preset group whose buttons each use equal flex sizing.

- [x] **Step 1: Write the failing layout test**

Create `src/components/form/PresetChips.test.tsx`:

```tsx
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
```

- [x] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm test --run src/components/form/PresetChips.test.tsx
```

Expected: FAIL because the current container uses `flex-wrap` without `w-full` or `flex-nowrap`, and buttons do not have `flex-1` or `min-w-0`.

- [x] **Step 3: Apply the minimal layout change**

In `src/components/form/PresetChips.tsx`, change the container and button classes as follows:

```tsx
<div
  className="flex w-full flex-nowrap items-center gap-2"
  role="group"
  aria-label={`${label} presets`}
>
```

Replace the button's first class string with:

```tsx
'min-h-[44px] min-w-0 flex-1 cursor-pointer rounded-xl px-3',
```

Leave all other button classes and behavior unchanged.

- [x] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm test --run src/components/form/PresetChips.test.tsx
```

Expected: PASS.

- [x] **Step 5: Run the full verification suite**

Run:

```bash
pnpm test -- --run
pnpm typecheck
pnpm lint
pnpm build
pnpm exec prettier --check src/components/form/PresetChips.tsx src/components/form/PresetChips.test.tsx
```

Expected: all tests, typecheck, lint, build, and formatting checks pass.

- [x] **Step 6: Review the final diff**

Run:

```bash
rtk git diff -- src/components/form/PresetChips.tsx src/components/form/PresetChips.test.tsx
rtk git status --short
```

Confirm that only the shared preset component, its focused test, and the approved design/plan documents are changed. Do not commit unless the user explicitly requests it.
