---
name: fe-fix
description: >
  Surgically fix a specific frontend bug or error. Takes an optional bug description,
  file path, or error message as input. Runs lint and typecheck to surface errors,
  reads only the affected files, applies the minimum change needed, then verifies.
  Use when the user says "fix X", "there's a bug in Y", or pastes an error message.
argument-hint: "<bug description | file path | error message>"
---

# Frontend Bug Fixer

Fix a specific frontend bug with the minimum viable change. Do not refactor, restructure,
or clean up code outside the fix. If you spot other issues while reading, note them but
do not touch them.

## Arguments

- `/fe-fix <description>` — describe the bug, paste an error, or name the file
- If no argument is given, run lint and typecheck and fix whatever they report.

---

## Step 1 — Locate the bug

**If an argument was provided:**

Use it to scope your search. Prefer targeted reads over full glob sweeps:

- If it names a file → read that file directly
- If it's a symbol or component name → `Grep` for it across `src/` before reading
- If it's an error message → extract the file path and line from the error, read that file

Do not read files that aren't relevant to the reported bug.

**If no argument was provided:**

Run automated checks and let errors direct which files to read:

```bash
bun lint
bun typecheck
```

Read only the files that have reported errors.

---

## Step 2 — Diagnose

Before writing any fix, state:

- What the bug is (one sentence)
- Which file(s) and line(s) are affected
- Root cause (not just symptom)

If the root cause is unclear, read one level deeper (e.g. the file that imports the broken module)
before forming a hypothesis. Stop reading once you have enough to act.

---

## Step 3 — Fix

Apply the minimum change that resolves the root cause. Constraints:

**TypeScript**
- Do not introduce `any` or `as` type assertions to silence errors — fix the type
- If a type is wrong, fix it at the declaration, not at the call site
- Prefer `unknown` + narrowing over casting

**React**
- Do not change component boundaries or extract new components — that is refactor work
- Fix broken hook dependencies without removing the hook
- Fix prop type mismatches at the interface, not with a cast

**Next.js**
- Do not toggle `"use client"` unless the bug is specifically about RSC/client boundary
- If a Server Component is importing a client-only API, wrap only the necessary part in a client component — do not promote the whole file

**General**
- One fix per commit concern — if two unrelated bugs surface, fix them separately
- Do not reformat surrounding code (the formatter will handle it)
- Do not add comments explaining the fix — that belongs in the commit message

---

## Step 4 — Verify

```bash
bun lint
bun typecheck
```

If new errors appear that weren't there before the fix, resolve them before reporting done.
Do not use `// @ts-ignore` or `// eslint-disable` to suppress errors.

---

## Step 5 — Report

Summarise the fix in plain terms:

- **Bug**: what was wrong
- **Root cause**: why it was wrong
- **Fix**: what changed (file + line range)
- **Verified**: lint and typecheck pass ✓

If any other issues were spotted but not fixed, list them under **Also noticed** so the
user can decide whether to address them.
