---
name: fe-create
description: >
  Scaffold and build a new frontend feature for this Next.js portfolio.
  Reads existing data files and component patterns first, builds following
  project conventions, verifies with lint and typecheck, then uses Chrome MCP
  to confirm zero console errors in the browser.
  Use when the user says "create X", "add X feature", "build X", or "I want X on the site".
argument-hint: "<feature-description>"
---

# Frontend Feature Builder

Build a new frontend feature for this Next.js + TypeScript + Tailwind portfolio.
Follow existing project patterns precisely — do not introduce new conventions.

## Arguments

- `/fe-create <feature>` — describe the feature to build
- If no argument is given, ask the user what they want to build.

---

## Step 1 — Understand the page structure

Read only these three files — they give the full layout and token picture:

```
src/app/page.tsx        — section layout and component composition
src/app/layout.tsx      — root layout, metadata, global wrappers
src/app/globals.css     — theme tokens (colours, spacing, custom utilities)
```

Note which sections exist, what theme tokens are available, and how components are composed.

---

## Step 2 — Sample existing patterns (targeted, not exhaustive)

Do **not** read every component. Instead:

1. Glob `src/components/**/*.tsx` and `src/data/*.ts` to see what exists
2. Read the **2–3 most relevant files** — pick the ones closest to the feature you're building
3. For specific patterns, use targeted Grep instead of full reads:
   - `"use client"` usage: `Grep pattern='"use client"' glob='src/components/**/*.tsx'`
   - Image usage: `Grep pattern='next/image' glob='src/**/*.tsx'`
   - Data file shape: read only the data file that matches the feature domain

Stop reading once you can answer: how are props typed, how is Tailwind applied, what
spacing/layout conventions are in use.

---

## Step 3 — Plan before building

State your plan in 3–5 bullet points:

- Which file(s) will be created or modified
- Where in `src/app/page.tsx` the feature will be inserted (if applicable)
- Whether a new data file is needed in `src/data/`
- Whether a new component is needed in `src/components/`
- Whether `"use client"` is required and why (or why not)

Ask the user to confirm if the scope is larger than expected. Otherwise proceed.

---

## Step 4 — Build the feature

Follow these conventions exactly:

**TypeScript**
- Use `type` (not `interface`) for props
- Type all props explicitly — never rely on inference
- Use `as const` for static data arrays in `src/data/`
- Avoid `any` — use `unknown` or narrow types

**React & Next.js**
- Default to Server Components — only add `"use client"` for event handlers, browser APIs, or hooks
- Push `"use client"` as far down the tree as possible
- Use `next/image` for all images with explicit `width`, `height`, and `alt`
- Anchor navigation uses `href="#section-id"` — do not use `next/link` for in-page anchors
- Match the existing section structure in `page.tsx` (same wrapper elements and spacing)

**Tailwind**
- Use only tokens defined in `globals.css` for colours — no hardcoded hex values
- Match spacing scale used in adjacent components
- Follow existing responsive patterns (check how other components handle mobile vs desktop)

**File placement**
- New components → `src/components/<FeatureName>.tsx`
- New data → `src/data/<feature-name>-data.ts`
- No barrel files (`index.ts`) — import directly from the file

**Import ordering** (linter enforced — alphabetical, grouped)
```
1. builtin
2. external  (react, next/*, lucide-react, etc.)
3. internal  (@/components/*, @/data/*, etc.)
4. parent / sibling / index
```

---

## Step 5 — Verify statically

Run both checks and fix all errors before reporting done:

```bash
bun lint
bunx tsc --noEmit
```

Fix all lint errors. Resolve all type errors — do not use `// @ts-ignore`.

---

## Step 6 — Verify in the browser

Navigate to the page that contains the new feature and check:

```
mcp__claude_in_chrome__navigate_page        — go to the route containing the new feature
mcp__claude_in_chrome__get_console_logs     — must be zero errors or warnings
mcp__claude_in_chrome__get_network_requests — no failed tRPC calls or image loads
mcp__claude_in_chrome__take_screenshot      — confirm the feature renders visually
```

If console errors appear, diagnose and fix before reporting done.

---

## Step 7 — Report

Summarise what was built:

- Files created or modified (with paths)
- Where the feature appears in the page
- Any assumptions made (e.g. placeholder data used, image path assumed)
- Any follow-up the user should handle (e.g. swap placeholder image, add real data)
- **Verified**: lint ✓  typecheck ✓  Chrome console clean ✓
