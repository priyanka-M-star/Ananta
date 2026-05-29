# Contributing to Ananta

Welcome! This document is the working agreement between everyone touching this codebase.

---

## 1. Branching strategy

We use a **simple trunk-based flow**:

- `main` — always deployable. Protected. No direct pushes.
- `feature/<short-name>` — your daily work branch.
- `fix/<short-name>` — bug fixes.
- `chore/<short-name>` — tooling, docs, deps.

```bash
# Start new work
git checkout main
git pull origin main
git checkout -b feature/quiz-grading

# ... write code ...

git add .
git commit -m "feat(quiz): add server-side grading endpoint"
git push -u origin feature/quiz-grading

# Open Pull Request on GitHub → merge into main when reviewed
```

---

## 2. Commit message convention

Conventional Commits. Short. Imperative.

```
<type>(<scope>): <short description>
```

**Types:**

| Type | When to use |
|------|------|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `chore` | Tooling, deps, config |
| `docs` | Documentation only |
| `refactor` | Code change, no behaviour change |
| `test` | Adding or fixing tests |
| `style` | Formatting, no logic change |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline |

**Examples (good):**

```
feat(auth): add OTP login via MSG91
fix(payments): retry failed UPI mandates after 24h
chore(deps): bump prisma to 5.18
docs(stack): explain why AI4Bharat over Google TTS
```

**Examples (bad — don't do):**

```
update                         ← too vague
fixed bug                      ← which bug?
asdfasdf                       ← please
WIP                            ← squash before PR
```

---

## 3. Pull Request rules

- One PR = one concern. Don't mix a refactor + a feature.
- PR title follows commit convention.
- PR description must include:
  - **What** changed
  - **Why** it was needed
  - **How** to test it (commands or steps)
  - Screenshot/GIF if UI changed
- At least 1 reviewer approval before merge.
- All CI checks green (lint, test, build).
- Squash-merge into `main`. No merge commits.

---

## 4. Daily workflow

We commit and push every working day. Even a small commit is better than a big one a week later.

**Morning:**
```bash
git checkout main
git pull origin main
git checkout -b feature/<today-task>
```

**End of day:**
```bash
git status                     # review what changed
git diff                       # read your own diff
git add .
git commit -m "feat(<scope>): <what>"
git push
```

If work isn't done yet, push the branch anyway — push early, push often. Open a `[WIP]` PR so your teammate can see progress.

---

## 5. Code style

- **TypeScript:** strict mode on. No `any` without a `// why` comment.
- **Python:** Black + Ruff. Type hints on every function.
- **React:** functional components, hooks only. No class components.
- **Imports:** absolute paths from package root (`@ananta/db`, `@ananta/ui`).
- **File names:** `kebab-case.ts` for TS, `snake_case.py` for Python.
- **Components:** `PascalCase.tsx`.
- **Comments:** explain *why*, not *what*. Code shows what.

---

## 6. Secrets — never commit

- `.env*` files are in `.gitignore`. Never `git add` one.
- Use Doppler for shared secrets. `doppler run -- pnpm dev`.
- If you accidentally commit a secret: rotate it immediately, then `git filter-repo` to remove from history.

---

## 7. Data privacy

This product handles minors' data (Grade 10-12 students). Treat student data like medical data:

- Never log a student's name, phone, or address.
- Use UUIDs in logs, not personal identifiers.
- Encrypt at rest (Postgres tablespace) and in transit (TLS 1.3).
- Parent consent required before any analytics on a student.

---

## 8. Tests

- New feature → at least one test (unit OR integration).
- Bug fix → regression test that would have caught the bug.
- Don't merge a PR with red CI.

---

## 9. Reviewing someone else's PR

- Read the description first. If it's unclear, ask before reviewing code.
- Pull and run locally before LGTMing UI changes.
- Be kind. The goal is good code, not winning.
- "Nit:" prefix for minor style suggestions that aren't blocking.
- Approve when you'd be comfortable maintaining this code yourself.

---

## 10. Things to ask in PRs

- "What happens if the user is offline?"
- "What happens if the API call fails?"
- "Is there a test for the unhappy path?"
- "Does this handle Kannada/Hindi text correctly?"
- "Will this break on a 3G connection?"
- "What does a parent see when this fails?"

---

Questions? Ask in the team chat or email priyanka.

Welcome aboard.
