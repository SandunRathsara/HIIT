# Create Round Form UX — Design Spec

**Date:** 2026-07-31
**Status:** Approved in conversation

---

## Context

The create-workout flow is a mobile-first React form. Each round currently
contains an Exercise field, a Time/Reps segmented control, Work or Reps
controls, an optional Reps Pace control, and Rest controls.

Two UX issues were identified:

1. The Time/Reps control visually appears to govern the entire remainder of the
   round card, although it only changes Work/Reps and Pace.
2. The time preset values are uneven: Work is `30 / 40 / 60` seconds and Rest is
   `15 / 20 / 60` seconds.

The existing product language is a dark navy fitness UI using Barlow and Barlow
Condensed, teal active states, rounded controls, and mobile-sized touch targets.
The redesign preserves that language.

## Approved Design

### Round hierarchy

Each round reads as two independent settings groups:

1. Exercise
2. Divider
3. Work
   - Time/Reps toggle
   - Work or Reps presets
   - Work or Reps stepper
   - Pace stepper and duration estimate when Reps is selected
4. Divider
5. Rest
   - Rest presets
   - Rest stepper

The Time/Reps control is visually scoped inside the Work group. Switching mode
only changes controls in that group. Rest remains visible, independent, and
unchanged.

The Work and Rest headings do not receive secondary hint text. The horizontal
divider is sufficient grouping and avoids copy such as `Time · 40s` or
`independent`.

### Presets and defaults

The new preset values are:

| Setting | Presets | New-round default |
|---|---|---|
| Work time | `30s`, `45s`, `60s` | `45s` |
| Rest time | `10s`, `20s`, `30s` | `20s` |

The Reps presets, Pace limits, and all general limits remain unchanged.

The default Work value changes from `40s` to `45s` so every new round starts
with an active Work preset. Existing saved workouts are not migrated or
rewritten. The seeded workout remains explicitly authored at `40s` Work.

### Visual and interaction rules

- Keep the existing dark navy, teal, Barlow, and Barlow Condensed visual system.
- Use horizontal dividers to separate Work and Rest; do not introduce nested
  cards or extra explanatory subtitles.
- Keep all interactive controls at least 44px in their touch dimension.
- Preserve visible keyboard focus rings and `aria-pressed` state on preset and
  segmented controls.
- Keep the existing 150–300ms transitions and reduced-motion behavior.
- Preserve the current mobile-first width and avoid horizontal overflow at
  375px.

## Implementation Scope

### Components and data

- `src/components/RoundCard.tsx`: reorganize the existing controls into the
  approved Work and Rest groups. Keep the current mode-switching behavior and
  reps-only Pace behavior.
- `src/db/schema.ts`: change `PRESETS.workTime` to `[30, 45, 60]`,
  `PRESETS.restTime` to `[10, 20, 30]`, and `DEFAULT_ROUND.value` to `45`.
- `src/screens/CreateWorkoutScreen.tsx`: no new state or data shape is needed;
  `newDraft` already inherits the default round.

### Out of scope

- No changes to the workout data model or persistence format.
- No changes to timer calculations or the running workout screen.
- No changes to saved workouts or seeded workout data.
- No new custom time input, recommendation engine, or workout coaching copy.
- No visual theme change.

## Verification

The implementation should verify:

- Time mode renders Work controls and does not render Pace.
- Reps mode renders Reps and Pace controls while Rest remains present and
  independent.
- The new-round default is `45s` Work and `20s` Rest, with the matching preset
  selected.
- Work presets are exactly `30 / 45 / 60` seconds.
- Rest presets are exactly `10 / 20 / 30` seconds.
- Existing duration estimation still uses the actual values in each round.
- Typecheck, lint, and the existing test suite pass.

## Rationale for Presets

The consulted ACSM/ACE guidance does not prescribe one universal HIIT preset
list. It commonly frames general HIIT around work intervals in the approximate
20–60 second range and recovery periods equal to or longer than work depending
on fitness level and intensity. The chosen values are a product-level preset
ladder, not medical advice or a universal training prescription.

Work `30 / 45 / 60` provides a simple progression through common interval
durations. Rest `10 / 20 / 30` provides shorter recovery choices that match the
app's existing interval style while fixing the large `20 → 60` jump. Users can
still use the steppers for any value allowed by the existing limits.

## Alternatives Considered

| Alternative | Why not selected |
|---|---|
| Scoped Work panel | Clearest grouping, but adds an additional visual container and more hierarchy than this mobile form needs. |
| Progressive disclosure | Most compact, but hides controls and introduces extra open/close behavior. |
| Work `20 / 40 / 60`, Rest `20 / 40 / 60` | Evenly spaced, but did not match the user's preferred practical presets. |
| Four preset buttons | Broader coverage, but denser at the target mobile width. |
