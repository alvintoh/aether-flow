---
name: arch-add
description: >
  Evaluate whether adding a new library or tool to the existing stack is
  feasible and architecturally sound. Assesses compatibility, overlap with
  existing dependencies, bundle impact, and long-term fit before installing.
  Use when the user says "add X", "install X", "can we use X", "is X a good fit",
  or "thinking of adding X".
argument-hint: "<library-to-add>"
---

# Library Addition Evaluator

Evaluate whether adding **[library]** to this project's stack is the right
architectural decision. Return a structured feasibility verdict before
any installation or integration work begins.

## Arguments

- `/arch-add <library>` — evaluate a specific library
- If no argument is given, ask the user which library they want to add.

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

## Step 2 — Check for Overlap with Existing Stack

Before evaluating the new library, identify if the project already has
something that covers the same need:

```bash
# Search for related imports in the codebase
grep -r "from ['\"]<related-keyword>" src/ --include="*.ts" --include="*.tsx" -l
```

Flag any existing packages in `package.json` that serve a similar purpose.
If overlap is found, note it prominently — adding redundant dependencies is
a common architectural mistake.

---

## Step 3 — Evaluate the Library

Assess the candidate library across these dimensions:

### 3a. Stack Compatibility

- Is it compatible with **Next.js 16** and **React 19**?
- Does it work with **Bun** as the runtime and package manager?
- Does it support **TypeScript strict mode** with full type definitions?
- Does it conflict with any existing package in `package.json`?
- Does it interact with the **React Compiler**? (already enabled in this project)
- Is it compatible with the **App Router** (Server Components, streaming, edge)?

### 3b. Necessity and Fit

- Does this project genuinely need this library, or can the need be met with
  what's already installed?
- Does its API style and conventions fit the existing codebase patterns?
- Is it solving a real current problem, or a speculative future one?

### 3c. Bundle and Performance Impact

- Is it a client-side library? If so, what is the bundle size impact?
- Can it be tree-shaken or lazy-loaded to minimise the cost?
- Does it add server-side weight (build time, cold start)?

### 3d. Ecosystem Health

- Is it actively maintained? (recent releases, open issues response time)
- Is it production-ready or still experimental/beta?
- Does it have a track record in projects using a similar stack?

### 3e. Long-term Scalability Fit

- Will this library still be a good choice as the project grows?
- Does it align with the direction the broader ecosystem is heading?
- Are there known limitations that would become blockers later?

---

## Step 4 — Verdict

Return one of three verdicts:

### ✅ Go
The library is compatible, fills a genuine gap, and has strong long-term fit.
Include:
- Why it's the right addition for this project
- How to integrate it (install command, key config, where it fits in the stack)
- Any gotchas to watch for during setup

### ⚠️ Conditional Go
The library is viable but has caveats that should be addressed first.
Include:
- What conditions must be met (e.g. a feature reaches stable, an existing lib
  is removed first to avoid duplication)
- What to do differently to make the addition safe
- Whether to wait or proceed now

### ❌ No-Go
The library introduces unacceptable risk, overlap, or incompatibility.
Include:
- The specific blocking reason(s)
- Whether the concern is permanent or time-bound
- An alternative approach if the underlying need is still valid

---

## Step 5 — Integration Skill Offer

If the verdict is **Go** or **Conditional Go**, offer to create an
`/integrate-<library>` skill that walks through the installation and
configuration steps identified above.

Keep the offer to one line — only create it if the user confirms.

---

## Output Format

```
## Library Addition Evaluation
Library: <library>

### Stack Compatibility   [✅ / ⚠️ / ❌]
### Necessity & Fit       [✅ / ⚠️ / ❌]
### Bundle Impact         [Low / Medium / High]
### Ecosystem Health      [✅ / ⚠️ / ❌]
### Scalability Fit       [✅ / ⚠️ / ❌]

## Verdict: [Go / Conditional Go / No-Go]
<reasoning>

## Next Steps
<integration steps if Go, conditions if Conditional Go, alternatives if No-Go>
```
