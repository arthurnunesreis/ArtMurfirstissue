# Working on HiveConcerts

## Before you start
1. Read `CLAUDE.md`. Its principles are non-negotiable.
2. Pick the next open issue in the current milestone. Phase 1 tasks are done in order.
3. Assign the issue to yourself.

## Branches and commits
- Branch from `main`: `phase1/<task-number>-<short-name>`.
- Commit messages: `phase1: <task number> <short title>` for task work; `chore:`, `docs:` or `fix:` for anything else.
- Keep each pull request to one task.

## Pull requests
- Fill in the template, including the acceptance-criteria checklist copied from `docs/PHASE-1.md`.
- CI must pass: typecheck, lint, unit tests.
- Tick the task's box in `docs/PHASE-1.md` in the same pull request.
- Squash-merge into `main`.

## Decisions
- If a task needs a product decision that isn't made, add it to `docs/OPEN-QUESTIONS.md`, open an issue labelled `decision`, and carry on with work that doesn't depend on it.
- When a decision is made, record it in the relevant doc and strike it through in `OPEN-QUESTIONS.md`.

## Secrets
Never commit secrets. Add new variables to `.env.example` with an empty value and a comment.
