---
name: refactor-code
description: >
  Refactor a frontend area for structure, readability, maintainability, and code
  reduction — no behaviour changes. Takes an optional target (component, directory,
  or concern). Grep-first to find issues before reading full files, plans before
  touching anything, confirms if scope is large, then applies changes, verifies with
  lint and typecheck, and confirms no runtime regressions via Chrome MCP.
argument-hint: "<component | directory | concern>"
---

# Frontend Refactor

Improve the structure and conciseness of existing frontend code without changing
behaviour. No new features, no bug fixes (unless a structural issue is a direct cause
of a bug). Leave external APIs, prop shapes, and exported types unchanged unless the
refactor explicitly requires it.

**Default bias: less code is better.** If two implementations are equivalent, prefer
the shorter one. Prefer language builtins, concise expressions, and composition over
verbose custom solutions.

## Arguments

- `/refactor-code <target>` — name a component, directory, or concern (e.g. "sidebar", "form hooks", "client boundary sprawl")
- If no argument is given, ask the user what area they want cleaned up.

---

## Step 1 — Scope the work (Grep before you Read)

Do not read full files speculatively. Use targeted searches to find what has issues,
then read only those files.

**If a component name is given:**
- Grep for the name to find its file path, then read that file + its direct imports

**If a directory is given:**
- Glob `src/<dir>/**/*.{ts,tsx}` with `head_limit: 30` to see the file list
- Grep for problem patterns in that directory before deciding which files to read fully

**If a concern is given**, search for the relevant pattern first:

| Concern | Grep pattern |
|---|---|
| Too many `useEffect`s | `useEffect` across `src/features/**/*.{ts,tsx}` |
| Client boundary sprawl | `"use client"` across `src/` |
| Duplicated fetch logic | `useQuery\|useSuspenseQuery` across `src/features/` |
| Inline JSX functions | `=>\s*{` or `onChange={\(` in JSX files |
| Multiple `useState` | `useState` with `count` mode per file |
| Verbose null checks | `=== null \|\| === undefined` or `!= null` across `src/` |
| Dead imports | `no-unused-vars` via `bun lint` output |
| Over-abstracted one-liners | single-statement functions/hooks used in one place only |

Read only the files where the Grep confirms an issue exists. Stop expanding scope when
you have enough to identify the structural problems.

---

## Step 2 — Identify refactor opportunities

Evaluate only the scoped files against these criteria — do not audit the whole project.

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

**Code reduction — less is more**
- Dead imports and unused variables → remove (lint flags these)
- Verbose null/undefined checks → `?.` optional chaining and `??` nullish coalescing
  ```ts
  // before
  const name = user && user.profile && user.profile.name ? user.profile.name : 'Guest';
  // after
  const name = user?.profile?.name ?? 'Guest';
  ```
- Redundant state that can be derived at render time → remove the `useState`, compute inline
  ```ts
  // before
  const [isValid, setIsValid] = useState(false);
  useEffect(() => setIsValid(email.includes('@')), [email]);
  // after
  const isValid = email.includes('@');
  ```
- Over-abstracted single-use extractions → inline them back
  (a helper used in exactly one place that adds no clarity is pure indirection)
- Verbose conditional rendering → ternary or `&&` short-circuit
  ```tsx
  // before
  {isLoading ? <Spinner /> : null}
  // after
  {isLoading && <Spinner />}
  ```
- Manual type shapes that duplicate existing types → use `Pick<T, ...>`, `Omit<T, ...>`, `Partial<T>`
- Repeated magic strings/numbers → extract a `const` at module scope
- Multi-step promise chains → `async/await`

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
- Prefer the shorter equivalent: if `?.`, `??`, a ternary, or a utility type replaces
  3+ lines with 1, make that trade — readability and brevity are the same goal here

**When extracting components:**
- Place them in the same file if they are only used there, or in `src/components/` if shared
- Name them clearly — a name like `WorkflowCardActions` beats `Inner` or `Part2`
- Type their props explicitly with a `type Props = { ... }` declaration

**When extracting hooks:**
- Place in `src/features/<domain>/hooks/use-<name>.ts`
- Return a named object `{ data, isLoading, ... }` — not a tuple unless it mirrors a React primitive
- Keep the hook focused — one concern per hook

---

## Step 5 — Verify statically

```bash
bun lint
bunx tsc --noEmit
```

Fix all errors before proceeding. The refactor must not break the type system or introduce
lint violations. Do not use `// @ts-ignore` or `// eslint-disable` to suppress errors.

---

## Step 6 — Verify in the browser with Chrome MCP

Navigate to the page(s) affected by the refactor and confirm no regressions:

```
mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page         — reload the affected route
mcp__plugin_chrome-devtools-mcp_chrome-devtools__list_console_messages — no new errors or warnings vs before the refactor
mcp__plugin_chrome-devtools-mcp_chrome-devtools__list_network_requests — no new failed requests
```

The page must render correctly — the refactor must be behaviour-transparent.
If any runtime regressions appear, fix them before reporting done.

---

## Step 7 — Report

```
Refactor complete — <target>

Changes:
- src/components/Foo.tsx — extracted FooHeader sub-component (line 42–78)
- src/features/workflows/hooks/use-fetch-workflow.ts — new hook (extracted from WorkflowList + WorkflowDetail)
- src/app/(dashboard)/workflows/page.tsx — pushed "use client" down to WorkflowActions

Code reduction: -34 lines net (3 dead imports removed, 2 derived states inlined, verbose null checks → ?.)

Behaviour unchanged: same props, same render output, same exported types.
Verified: lint ✓  typecheck ✓  Chrome console clean ✓
```

If any bugs or non-refactor improvements were spotted, list them under **Also noticed**
so the user can decide whether to address them separately.
