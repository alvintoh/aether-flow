---
name: arch-evaluate
description: >
  Evaluate whether adding a new library or replacing an existing tool is
  architecturally sound for this project. Covers compatibility, overlap,
  migration cost, ecosystem health, and long-term fit. Returns a structured
  verdict before any installation or migration begins.
  Use when the user says "add X", "install X", "can we use X", "replace X with Y",
  "swap X for Y", "migrate from X to Y", or "is Y a good replacement for X".
argument-hint: "add|a <library> | replace|r <current> <replacement> | n (cancel)"
---

# Stack Evaluator

Evaluate whether a proposed stack change — adding a library or replacing a tool —
is the right architectural decision for this project. Return a structured verdict
before any installation or migration work begins.

## Arguments

- `/arch-evaluate add <library>` or `/arch-evaluate a <library>` — evaluate adding a new library
- `/arch-evaluate replace <current> <replacement>` or `/arch-evaluate r <current> <replacement>` — evaluate swapping one tool for another
- `/arch-evaluate n` — cancel immediately, output "Cancelled." and stop
- If the mode is omitted, infer it from phrasing: "add/install/use" → `add`, "replace/swap/migrate" → `replace`
- If arguments are ambiguous, ask the user before proceeding

---

## Step 1 — Understand the Project Context

Read the following files to understand the current stack and constraints:

```bash
cat package.json
cat CLAUDE.md
cat tsconfig.json
```

Extract:
- Runtime (Bun, Node, Edge)
- Framework version (Next.js 16, React 19)
- TypeScript strictness
- Existing libraries that may overlap with or conflict with the candidate
- Any stated conventions or gotchas in CLAUDE.md

---

## Step 2 — Audit Current State

### Mode: `add`

Check whether the project already has something that covers the same need:

```bash
grep -r "from ['\"]<related-keyword>" src/ --include="*.ts" --include="*.tsx" -l
```

Flag any existing packages in `package.json` that serve a similar purpose.
If meaningful overlap is found, the verdict may be **Not Needed** — adding a
redundant dependency is a common architectural mistake.

### Mode: `replace`

Find every place the current tool is used in the codebase:

```bash
grep -r "from ['\"]<current-tool>" src/ --include="*.ts" --include="*.tsx" -l
grep -r "require(['\"]<current-tool>" src/ --include="*.ts" --include="*.tsx" -l
grep -r "<current-tool>" . --include="*.json" --include="*.ts" --include="*.mjs" \
  --exclude-dir=node_modules --exclude-dir=.next -l
```

Read the returned files to understand:
- How deeply the tool is integrated (surface import vs. deeply coupled)
- Whether the API is used directly or abstracted behind a wrapper
- How many files would need to change

If the current tool fully covers the need already, the verdict may be **Not Needed**.

---

## Step 3 — Evaluate

Assess the candidate across these dimensions (adapt labels per mode):

### 3a. Stack Compatibility

- Compatible with **Next.js 16** and **React 19**?
- Works with **Bun** as the runtime and package manager?
- Supports **TypeScript strict mode** with full type definitions?
- Conflicts with any existing package in `package.json`?
- Interacts with the **React Compiler**? (already enabled in this project)
- Compatible with the **App Router** (Server Components, streaming, edge)?

### 3b. Necessity & Fit / Feature Parity

**`add`**: Does the project genuinely need this library, or is the need met by
what's already installed? Does its API style fit existing codebase patterns?
Is it solving a real current problem, or a speculative future one?

**`replace`**: Does the replacement cover everything the current tool does that
this project actually uses? Are any features missing that would require workarounds?

### 3c. Bundle Impact / Migration Cost

**`add`**: Is it a client-side library? What is the bundle size impact? Can it
be tree-shaken or lazy-loaded? Does it add server-side weight?

**`replace`**: How many files need to change? Are there breaking API differences?
Can the migration be done incrementally? Is a codemod or migration guide available?

### 3d. Ecosystem Health

- Actively maintained? (recent releases, open issues response time)
- Production-ready or still experimental/beta?
- Track record in projects using a similar stack?

### 3e. Scalability Fit

- Will this still be a good choice as the project grows?
- Aligned with where the broader ecosystem is heading?
- Known limitations that would become blockers later?

---

## Step 4 — Verdict

Return one of four verdicts:

### ✅ Go
The change is compatible, fills a genuine gap, and has strong long-term fit.
Include:
- Why it's the right decision for this project
- How to integrate or migrate (key steps, config changes, where it fits)
- Any gotchas to watch for during setup or migration

### ⚠️ Conditional Go
The change is viable but has caveats that must be addressed first.
Include:
- What conditions must be met (e.g. feature reaches stable, existing lib removed first)
- What to do differently to make the change safe
- Whether to wait or proceed now

### 🔄 Not Needed
The existing stack already covers this need. Adding or replacing would introduce
redundancy or unnecessary churn.
Include:
- Which existing package or built-in already handles the need
- How to use it for the stated goal
- Whether the user's intent reveals a gap worth addressing in a different way

### ❌ No-Go
The change introduces unacceptable risk, overlap, or incompatibility.
Include:
- The specific blocking reason(s)
- Whether the concern is permanent or time-bound
- An alternative approach if the underlying need is still valid

---

## Step 5 — Follow-up Skill Offer

If the verdict is **Go** or **Conditional Go**:
- `add` mode → offer to create an `/integrate-<library>` skill
- `replace` mode → offer to create a `/migrate-<replacement>` skill

Keep the offer to one line — only create it if the user confirms.

---

## Output Format

### `add` mode

```
## Library Addition Evaluation
Library: <library>

### Stack Compatibility      [✅ / ⚠️ / ❌]
### Necessity & Fit          [✅ / ⚠️ / ❌ / 🔄 Already covered]
### Bundle Impact            [Low / Medium / High]
### Ecosystem Health         [✅ / ⚠️ / ❌]
### Scalability Fit          [✅ / ⚠️ / ❌]

## Verdict: [Go / Conditional Go / Not Needed / No-Go]
<reasoning>

## Next Steps
<integration steps if Go, conditions if Conditional Go, existing alternative if Not Needed, alternatives if No-Go>
```

### `replace` mode

```
## Tool Replacement Evaluation
Current:     <current-tool>
Replacement: <replacement-tool>

### Stack Compatibility      [✅ / ⚠️ / ❌]
### Feature Parity           [✅ / ⚠️ / ❌ / 🔄 Current tool sufficient]
### Migration Cost           [Low / Medium / High]
### Ecosystem Health         [✅ / ⚠️ / ❌]
### Scalability Fit          [✅ / ⚠️ / ❌]

## Verdict: [Go / Conditional Go / Not Needed / No-Go]
<reasoning>

## Next Steps
<migration steps if Go, conditions if Conditional Go, existing alternative if Not Needed, alternatives if No-Go>
```
