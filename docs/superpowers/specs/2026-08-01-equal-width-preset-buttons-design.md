# Equal-Width Preset Buttons

## Goal

Make the Prepare delay, Work, and Rest preset button groups distribute their
buttons evenly across the available width on the create-workout screen.

## Scope

- Update the shared `PresetChips` component used by all three groups.
- Keep the existing labels, active states, click behavior, colors, spacing,
  focus styles, and 44px minimum touch height.
- Prevent the preset buttons from wrapping at the supported mobile width.
- Make each button consume an equal share of the row with `flex: 1`.
- Add a focused component test for the layout classes.

## Design

The `PresetChips` container will remain a flex container, become explicitly
full width, and use a single non-wrapping row. Each button will use `flex-1`
to divide the available space equally and `min-w-0` to allow flex sizing to
win over intrinsic button width. The existing `min-h-[44px]` remains in place
for touch accessibility.

No changes are needed in `RoundCard` or `CreateWorkoutScreen` because both
already use the shared component for the requested groups.

## Verification

- Test that the preset group has the full-width, non-wrapping flex classes.
- Test that every preset button has equal-flex sizing classes.
- Run the focused test, full test suite, typecheck, lint, and build.
