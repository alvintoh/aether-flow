---
name: issue-resolve
description: >
  Resolve a GitHub issue end-to-end: list open issues, pick one, read it, locate
  the relevant code, apply the minimum fix, commit referencing the issue, then
  ask whether to push directly or open a PR.
  Use when the user says "resolve an issue", "fix issue #N", "close issue #N", or "work on a gh issue".
argument-hint: "<issue number | leave blank to list open issues>"
---

# GH Resolve

Pick a GitHub issue, fix it, and ship it — push directly or open a PR.

## Arguments

- `/issue-resolve <number>` — skip the list, go straight to that issue
- `/issue-resolve` (no args) — show open issues and let the user pick

---

## Step 1 — Select an issue

### If an issue number was provided

```bash
gh issue view <number>
```

Skip to Step 2.

### If no argument was provided

```bash
gh issue list --state open --limit 20
```

Display the results and ask:

```
Open issues:
  #42  Bug: search pagination breaks on empty results
  #38  Enhancement: add loading skeleton to workflow list
  ...

Which issue do you want to resolve? (enter number)
```

Wait for the user to enter a number, then run `gh issue view <number>`.

---

## Step 2 — Understand the issue

Parse the issue body for:
- What is broken or missing
- Where (file, component, route — if mentioned)
- Steps to reproduce or acceptance criteria

If the issue is an `enhancement` label with no clear acceptance criteria, ask:
```
This looks like a feature request. What's the expected outcome so I know when it's done?
```

---

## Step 3 — Locate the code

Use Grep and Glob to find the relevant files. Do not read full files yet — confirm the location first.

Start with the most specific signal from the issue (component name, route, error message, symbol).

If nothing in the issue points to a specific location, grep for the feature area mentioned in the title.

---

## Step 4 — Apply the fix

Read only the affected files (line-range reads where possible).

Apply the minimum change needed to resolve the issue. Do not refactor surrounding code, add comments, or change unrelated behaviour.

Run static checks after the fix:

```bash
bun lint
bunx tsc --noEmit
```

Fix any errors introduced by the change before proceeding. If the fix cannot be applied cleanly, stop and explain why to the user.

---

## Step 5 — Confirm the fix

Show a summary:

```
Fix summary:
  File: src/features/workflows/components/workflows.tsx:84
  Change: <one-line description>

Does this look right? (y)es / (e)dit / (x)cancel
```

If the user says `(e)dit`, accept their instructions and re-apply before continuing.

---

## Step 6 — Commit

Commit with a message that references the issue so GitHub auto-closes it on merge:

```bash
git add <affected files>
git commit -m "$(cat <<'EOF'
fix: <short description>

Fixes #<number>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Step 7 — Ship it

Ask the user:

```
Fix committed. How do you want to ship it?
  (p) push directly to current branch
  (r) open a pull request
```

### If (p) — push

```bash
git push
```

Print:
```
Pushed. Issue #<number> will close when this lands on the default branch.
```

### If (r) — open PR

```bash
gh pr create \
  --title "fix: <short description>" \
  --body "$(cat <<'EOF'
## Summary
<one paragraph describing the fix>

Fixes #<number>

## Test plan
- [ ] <reproduction steps from the issue no longer trigger the bug>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Print:
```
PR opened: <URL>
Issue #<number> will close automatically when the PR merges.
```

---

## Rules

- Never apply changes beyond the scope of the issue
- Never close the issue manually — always use `Fixes #N` in the commit so GitHub handles it
- Always run lint and typecheck before committing
- Always confirm the fix with the user before committing (Step 5)
- If the issue cannot be reproduced or the fix is unclear, stop and ask rather than guessing
