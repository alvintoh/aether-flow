---
name: commit-review
description: Use when you want Claude to stage all changes, review them, and suggest a commit message before you decide whether to commit and push.
---

# Commit Review

Stage all changes, review them, and propose a conventional commit message. You decide whether to commit, then whether to push.

## Steps

1. Run `git status` to check for any changes (tracked or untracked)
2. Run `git add -A` to stage all changes
3. Run `git diff --cached` to see what is now staged
4. Analyze the changes and infer intent
5. Propose a commit message in conventional commit format: `type(scope): description`
6. Show the message and ask: commit with this message, edit it, or cancel?
7. If the user confirms, run `git commit -m "<message>"` with a `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` trailer
8. After committing, ask: push to remote? (push / skip)

## Conventional Commit Types

| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling, deps, config |
| `refactor` | Code change without behavior change |
| `style` | Formatting, whitespace |
| `docs` | Documentation |
| `test` | Tests |
| `perf` | Performance improvement |

## Output Format

Present the suggestion like this:

```
Staged changes: [brief summary of what's changed]

Suggested commit message:
  feat(auth): add JWT refresh token support

Proceed? (commit / edit / cancel)
```

After committing:

```
Committed: feat(auth): add JWT refresh token support

Push to remote? (push / skip)
```

## Rules

- Always stage with `git add -A` before reviewing — never skip this step
- If there is nothing to stage (clean working tree), say so and stop
- If staged changes span multiple concerns, flag it and suggest splitting
- Wait for user confirmation before running `git commit`
- After committing, always ask whether to push — never push automatically
- Run `git push` only if the user confirms
- Never commit `.env` files or files likely containing secrets — warn the user if found
