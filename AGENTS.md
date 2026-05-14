## Shell Command Rules

- NEVER use `npx` directly through the `rtk` hook if it causes script errors.
- ALWAYS prefix `npx` commands with `rtk proxy` to ensure correct command routing.
  - Correct: `rtk proxy npx <package>`
  - Incorrect: `npx <package>` (or allowing the auto-hook to handle it)
- NEVER use `npm` or `yarn` for this project. always use `pnpm`.

## `docs/CURRENT_STATE.md` — codebase source of truth

### Scope

This is a standalone convention. No companion docs required. If a BRS, CHANGELOG, or feature tree exists, you may consult them, but `CURRENT_STATE.md` remains the canonical answer to _"what is this codebase today?"_.

### What it is

Single markdown file answering: **what does this codebase do today, and where is everything?** The only doc you must read to become productive in a new session.

It is **not**:

- a plan — no in-flight or upcoming work
- a history — no completed-task log
- a spec — no business requirements

### When to read it

Always, on first interaction with the repo in a session, **before** any other code exploration. After that, navigate from it to specific files. If a user question can be answered from it, answer from it — do not re-crawl the tree.

### Reading the caveman style

File is written in compressed style. To parse:

- Bullet fragments without articles (`the`, `a`).
- Symbols: `→` leads-to · `⊕` and-also · `~` approximately · `Δ` change.
- `file:line` references point directly to source (e.g. `auth/login.ts:42`).
- Empty section with `(none)` means the heading is intentionally empty, not missing.

### Creating or updating it

Do **not** author or edit `CURRENT_STATE.md` inline during normal work (planning, implementation, testing, etc.). Generation and updates happen only when explicitly invoked via the `/current-state` slash command.

If you spot a stale or missing entry while doing other work, surface it to the user — do not silently fix it.

