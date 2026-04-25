---
name: fe-refactor
description: >
  Refactor a frontend area for structure, readability, and maintainability — no
  behaviour changes. Takes an optional target (component, directory, or concern).
  Reads only the scoped area, plans before touching anything, confirms if scope
  is large, then applies changes and verifies with lint and typecheck.
argument-hint: "<component | directory | concern>"
---

# Frontend Refactor

Improve the structure of existing frontend code without changing behaviour. No new
features, no bug fixes (unless a structural issue is a direct cause of a bug). Leave
external APIs, prop shapes, and exported types unchanged unless the refactor explicitly
requires it.

## Arguments

- `/fe-refactor <target>` — name a component, directory, or concern (e.g. "sidebar", "form hooks", "client boundary sprawl")
- If no argument is given, ask the user what area they want cleaned up.

---

## Step 1 — Scope the work

**Identify the target area.** Do not read the entire codebase — read only what is in scope:

- If a component name is given → Grep for it, then read the file and its direct imports
- If a directory is given → Glob `src/<dir>/**/*.{ts,tsx}`, read every file returned
- If a concern is given (e.g. "too many useEffects", "duplicated fetch logic") → Grep for
  the relevant pattern first, then read only the matching files

Stop expanding scope when you have enough to identify the structural problems.

---

## Step 2 — Identify refactor opportunities

Evaluate the scoped files against these criteria. Only flag issues that are in scope —
do not audit the whole project.

**Component structure**
- Single-responsibility: does each component do one thing?
- Inline JSX that belongs in a named sub-component (rule of thumb: >30 lines of JSX in one return)
- Prop drilling more than 2 levels deep — consider extracting context or composing differently
- Repeated JSX patterns (same structure in 3+ places) — extract a shared component

**Hooks & logic**
- `useEffect` used for derived state → compute during render instead
- Multiple `useState` calls managing related state → consolidate with `useReducer`
- Duplicated fetch/mutation logic across components → extract a custom hook in `src/features/<domain>/hooks/`
- Stale closure bugs from missing or incorrect dependency arrays

**Client/Server boundary (Next.js App Router)**
- `"use client"` applied to a whole file when only a small interactive part needs it
  → extract the interactive part into a leaf client component
- Data fetching happening in a client component that could be a Server Component
- `useEffect` used to fetch data → move to server component or React Query

**TypeScript**
- `any` → replace with `unknown` + narrowing or a proper type
- Repeated inline type shapes → extract a named `type`
- Type assertions (`as Foo`) hiding real mismatches → fix the underlying type

**Performance**
- Inline object/array/function literals in JSX props causing unnecessary re-renders
  → hoist to module scope or memoize with `useMemo`/`useCallback` where measured
- Heavy imports from barrel files → import directly from source file

---

## Step 3 — Plan

Before touching any file, present a concise plan:

```
Refactor plan — <target>

1. Extract <InlineBlock> from <Component> into a named sub-component
2. Replace 3 useState calls in <Form> with useReducer
3. Push "use client" down from layout.tsx to <InteractiveWidget> only
4. Extract shared useFetchWorkflow hook used in WorkflowList and WorkflowDetail
```

**If the plan touches more than 5 files**, ask the user to confirm before proceeding.
Otherwise proceed directly.

---

## Step 4 — Refactor

Apply changes in the order listed in the plan. For each change:

- Keep the same external API (exported component name, prop shape, return type)
- Do not rewrite logic — only restructure it
- Do not add new functionality
- Do not change formatting of untouched lines (the formatter handles that)

**When extracting components:**
- Place them in the same file if they are only used there, or in `src/components/` if shared
- Name them clearly — a name like `WorkflowCardActions` beats `Inner` or `Part2`
- Type their props explicitly with a `type Props = { ... }` declaration

**When extracting hooks:**
- Place in `src/features/<domain>/hooks/use-<name>.ts`
- Return a named object `{ data, isLoading, ... }` — not a tuple unless it mirrors a React primitive
- Keep the hook focused — one concern per hook

---

## Step 5 — Verify

```bash
bun lint
bun typecheck
```

Fix all errors before reporting. The refactor must not break the type system or introduce
lint violations. Do not use `// @ts-ignore` or `// eslint-disable` to suppress errors.

---

## Step 6 — Report

```
Refactor complete — <target>

Changes:
- src/components/Foo.tsx — extracted FooHeader sub-component (line 42–78)
- src/features/workflows/hooks/use-fetch-workflow.ts — new hook (extracted from WorkflowList + WorkflowDetail)
- src/app/(dashboard)/workflows/page.tsx — pushed "use client" down to WorkflowActions

Behaviour unchanged: same props, same render output, same exported types.
Verified: lint ✓  typecheck ✓
```

If any bugs or non-refactor improvements were spotted, list them under **Also noticed**
so the user can decide whether to address them separately.
