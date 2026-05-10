---
name: fe-fix
description: >
  Surgically fix a specific frontend bug or error. Takes an optional bug description,
  file path, or error message as input. Captures live Chrome console logs first,
  runs lint and typecheck to surface static errors, reads only the affected files,
  applies the minimum change needed, then verifies.
  Use when the user says "fix X", "there's a bug in Y", or pastes an error message.
argument-hint: "<bug description | file path | error message>"
---

# Frontend Bug Fixer

Fix a specific frontend bug with the minimum viable change. Do not refactor, restructure,
or clean up code outside the fix. If you spot other issues while reading, note them but
do not touch them.

## Arguments

- `/fe-fix <description>` — describe the bug, paste an error, or name the file
- If no argument is given, capture Chrome logs and run lint/typecheck, fix what they report.

---

## Step 0 — Capture live browser diagnostics

Before reading any code, pull the live signal from the browser. This gives the exact
error message, stack trace, and file:line — far more precise than static analysis alone.

```
mcp__claude_in_chrome__get_console_logs    — errors, warnings, uncaught exceptions
mcp__claude_in_chrome__get_network_requests — failed requests (4xx/5xx, CORS, tRPC)
```

Record the **exact error message** and **file path + line number** from the stack trace.
If the extension is not connected or returns nothing useful, proceed to Step 1.

---

## Step 1 — Locate the bug

**If a Chrome MCP stack trace or argument was provided:**

Use the error location to read directly — do not glob speculatively:

- Extract the file path and line number from the stack trace
- Read that file using `offset` and `limit` to read ±60 lines around the error line
- If the error crosses a module boundary (e.g., import error), read the imported module too

Stop reading the moment you have enough context to form a hypothesis.

**If neither Chrome MCP nor an argument pointed to a specific file:**

Run automated checks and let errors direct which files to read:

```bash
bun lint
bunx tsc --noEmit
```

Read only the files that have reported errors, using line-range reads for large files.

---

## Step 2 — Diagnose

Before writing any fix, state:

- What the bug is (one sentence)
- Which file(s) and line(s) are affected
- Root cause (not just symptom)

If the root cause is unclear, read one level deeper (e.g. the file that imports the broken
module) before forming a hypothesis. Stop reading once you can act.

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
- If a Server Component is importing a client-only API, wrap only the necessary part in a
  client component — do not promote the whole file

**General**
- One fix per commit concern — if two unrelated bugs surface, fix them separately
- Do not reformat surrounding code (the formatter will handle it)
- Do not add comments explaining the fix — that belongs in the commit message

---

## Step 4 — Verify

```bash
bun lint
bunx tsc --noEmit
```

Then reload the page and confirm via Chrome extension:
```
mcp__claude_in_chrome__navigate_page       — reload to the affected route
mcp__claude_in_chrome__get_console_logs    — original error must be gone, no new ones
mcp__claude_in_chrome__get_network_requests — previously failing requests now succeed
```

If new errors appear that weren't there before the fix, resolve them before reporting done.
Do not use `// @ts-ignore` or `// eslint-disable` to suppress errors.

---

## Step 5 — Report

Summarise the fix in plain terms:

- **Bug**: what was wrong
- **Root cause**: why it was wrong
- **Fix**: what changed (file + line range)
- **Verified**: lint ✓  typecheck ✓  Chrome console clean ✓

If any other issues were spotted but not fixed, list them under **Also noticed** so the
user can decide whether to address them.
