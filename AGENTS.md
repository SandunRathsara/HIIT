# HIIT Timer - Agent Seed

## Project

Personal-use, mobile-responsive HIIT timer PWA with configurable interval workouts, speech cues, and IndexedDB (Dexie) persistence incl. seeded workouts and a round editor.

Primary stack: React 19 + TypeScript + Vite 7 (PWA) + Tailwind CSS v4 + shadcn/ui + Dexie + Vitest; pnpm. Details: `docs/ARCHITECTURE.md`.

## Knowledge Routing

| Work | Read | How |
|---|---|---|
| User behavior, requirements, workflows, terminology, scope, or domain rules | `docs/DOMAIN.md` | Read before behavior or requirements work. |
| Components, dependency direction, integrations, state ownership, significant dependencies, runtime/build shape, or local setup | `docs/ARCHITECTURE.md` | Read before structural or environment work. |
| Locating, explaining, changing, or debugging source | `docs/CODEBASE_MAP.md` | Read the entire file before source work, then follow its `path#symbol` anchors. |
| A consequential domain or technical decision | `docs/adr/INDEX.md` | Read the index first, then only matching ADRs. |
| Planning a new capability | `docs/deferred/INDEX.md` | Read the index first, then only matching deferred details. |

## User-Facing Output

Write all user-facing output for a reader with ADHD. Keep it concise, concrete, easy to scan, and in ASD-STE100 Simplified Technical English.

- Lead with the answer; omit preamble and restatement.
- Use the shortest clear structure: line, bullets, table, tree, or flow.
- Preserve exact identifiers, paths, commands, errors, and code.
- Report progress only for discoveries, decisions, or blockers; finish with changes and verification.
