---
name: fe-create
description: >
  Scaffold and build a new frontend feature for this Next.js portfolio.
  Reads existing data files and component patterns first, builds following
  project conventions, then runs lint and typecheck to verify correctness.
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

## Step 1 — Understand the project

Read these files before writing a single line of code:

```
src/app/page.tsx          — current page structure and section layout
src/app/layout.tsx        — root layout, metadata, global wrappers
src/app/globals.css       — theme tokens (colours, spacing, custom utilities)
```

Extract:
- Which sections exist and how they are structured
- What theme tokens are available (`--background`, `--foreground`, `--accent`, etc.)
- How components are imported and composed in the page

---

## Step 2 — Read existing data and components

Use Glob to discover — do not assume file names:

- Pattern `src/data/*.ts` — read every data file to understand shape and naming
- Pattern `src/components/**/*.tsx` — read every component to understand patterns

From the components, note:
- How props are typed (inline `type Props`, exported type, or none)
- Whether `"use client"` is used and why
- How Tailwind classes are applied (className strings, conditional logic)
- How `next/image` and `next/link` are used
- Any shared layout or spacing conventions

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

**Import ordering** (ESLint enforced — alphabetical, grouped)
```
1. builtin
2. external  (react, next/*, lucide-react, etc.)
3. internal  (@/components/*, @/data/*, etc.)
4. parent / sibling / index
```

---

## Step 5 — Verify

Run both checks and fix all errors before reporting done:

```bash
bun lint
bun typecheck
```

If lint reports import ordering violations, fix them.
If typecheck reports errors, resolve them — do not use `// @ts-ignore`.

---

## Step 6 — Report

Summarise what was built:

- Files created or modified (with paths)
- Where the feature appears in the page
- Any assumptions made (e.g. placeholder data used, image path assumed)
- Any follow-up the user should handle (e.g. swap placeholder image, add real data)
