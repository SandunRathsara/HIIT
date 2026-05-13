## Shell Command Rules

- NEVER use `npx` directly through the `rtk` hook if it causes script errors.
- ALWAYS prefix `npx` commands with `rtk proxy` to ensure correct command routing.
  - Correct: `rtk proxy npx <package>`
  - Incorrect: `npx <package>` (or allowing the auto-hook to handle it)

