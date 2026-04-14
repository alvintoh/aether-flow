---
name: arch-replace
description: >
  Evaluate whether a tool or library replacement is architecturally sound for
  this project. Assesses stack compatibility, migration cost, ecosystem health,
  and future scalability before committing to the change.
  Use when the user says "replace X with Y", "swap X for Y", "migrate from X to Y",
  or "is Y a good replacement for X".
argument-hint: "<current-tool> <replacement-tool>"
---

# Tool Replacement Evaluator

Evaluate whether replacing **[current-tool]** with **[replacement-tool]** is the right
architectural decision for this project. Return a structured verdict before any
migration work begins.

## Arguments

- `/arch-replace <current> <replacement>` — evaluate a specific swap
- If no arguments are given, ask the user which tools they want to compare.

---

## Step 1 — Understand the Project Context

Read the following files to understand the stack and constraints:

```bash
cat package.json
cat CLAUDE.md
cat tsconfig.json
```

Extract:
- Runtime (Bun, Node, Edge)
- Framework version (Next.js 16, React 19)
- TypeScript strictness
- Other tooling that may interact with the tool being replaced (tRPC, Prisma, Tailwind, etc.)
- Any stated conventions or gotchas in CLAUDE.md

---

## Step 2 — Audit Current Tool Usage

Find every place the current tool is used in the codebase:

```bash
# Imports and requires
grep -r "from ['\"]<current-tool>" src/ --include="*.ts" --include="*.tsx" -l
grep -r "require(['\"]<current-tool>" src/ --include="*.ts" --include="*.tsx" -l

# Config references
grep -r "<current-tool>" . --include="*.json" --include="*.ts" --include="*.mjs" \
  --exclude-dir=node_modules --exclude-dir=.next -l
```

Read the files returned to understand:
- How deeply the tool is integrated (surface import vs. deeply coupled)
- Whether the tool's API is used directly or abstracted behind a wrapper
- How many files would need to change

---

## Step 3 — Evaluate the Replacement

Assess the proposed replacement across these dimensions:

### 3a. Stack Compatibility

- Is it compatible with **Next.js 16** and **React 19**?
- Does it work with **Bun** as the runtime and package manager?
- Does it support **TypeScript strict mode**?
- Does it conflict with any other package already in `package.json`?
- Does it interact with the **React Compiler**? (already enabled in this project)

### 3b. Feature Parity

- Does it cover everything the current tool does that this project actually uses?
- Are there features missing that would require workarounds or additional packages?
- Does its API style fit the existing codebase patterns?

### 3c. Migration Cost

- How many files need to change?
- Are there breaking API differences (config format, method names, import paths)?
- Can the migration be done incrementally, or is it all-or-nothing?
- Is there an automated codemod or migration guide available?

### 3d. Ecosystem Health

- Is it actively maintained? (recent releases, open issues response time)
- Is it production-ready or still experimental/beta?
- Does it have a track record in projects of similar scale and stack?

### 3e. Scalability and Roadmap Fit

- Will this tool still be a good choice as the project grows?
- Does it align with the direction the broader ecosystem is heading?
- Are there known limitations that would become blockers later?

---

## Step 4 — Verdict

Return one of three verdicts:

### ✅ Go
The replacement is compatible, migration is tractable, and the long-term fit is strong.
Include:
- Why the replacement is better for this project
- High-level migration steps (file count, config changes, script updates)
- Any risks to watch for during migration

### ⚠️ Conditional Go
The replacement is viable but has caveats that must be addressed first.
Include:
- What conditions must be met (e.g. a feature reaches stable, a workaround exists)
- What to do differently to make the migration safe
- Whether to wait or proceed now

### ❌ No-Go
The replacement introduces unacceptable risk or incompatibility.
Include:
- The specific blocking reason(s)
- Whether the concern is permanent or time-bound
- Alternative approaches if the user's underlying goal can still be met another way

---

## Step 5 — Migration Skill Offer

If the verdict is **Go** or **Conditional Go**, offer to create a `/migrate-<replacement-tool>`
skill that automates the migration steps identified above.

Keep the offer to one line — only create it if the user confirms.

---

## Output Format

```
## Tool Replacement Evaluation
Current:     <current-tool>
Replacement: <replacement-tool>

### Stack Compatibility   [✅ / ⚠️ / ❌]
### Feature Parity        [✅ / ⚠️ / ❌]
### Migration Cost        [Low / Medium / High]
### Ecosystem Health      [✅ / ⚠️ / ❌]
### Scalability Fit       [✅ / ⚠️ / ❌]

## Verdict: [Go / Conditional Go / No-Go]
<reasoning>

## Next Steps
<migration steps if Go, conditions if Conditional Go, alternatives if No-Go>
```
