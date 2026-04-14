---
name: fe-review
description: Review all frontend components in src/app/ against TypeScript, React, Next.js App Router, performance, accessibility, and security best practices. Runs lint and typecheck first, then returns a prioritised findings list.
---

You are running a structured frontend code review of this Next.js + TypeScript + Tailwind portfolio.

## Step 1 — Automated checks

Run the following commands and note any errors or warnings:

```bash
bun lint
bun typecheck
```

## Step 2 — Discover and read all component files

Use Glob to discover files rather than relying on a fixed list:

- Pattern `src/components/**/*.tsx` — all components
- Pattern `src/app/page.tsx` and `src/app/layout.tsx` — app entry points
- Pattern `src/data/*.ts` — all data files

Read every file returned by these globs.

## Step 3 — Review against these criteria

**TypeScript**

- Prefer `type` over `interface` unless declaration merging is needed
- Avoid `any` — use `unknown`, generics, or narrowed types
- Type component props explicitly — never rely on inferred JSX prop types
- Use `as const` for static data arrays
- Avoid type assertions (`as Foo`)

**React & Hooks**

- Keep components single-responsibility
- Avoid index keys in lists — use stable, unique IDs
- Never create objects/arrays/functions inline in JSX props
- Use `useReducer` for complex local state over multiple `useState` calls
- Avoid `useEffect` for derived state — compute during render

**Next.js App Router**

- Default to Server Components — `"use client"` only for event handlers, browser APIs, or hooks
- Push `"use client"` as far down the tree as possible
- Use `generateMetadata` for SEO — never hardcode `<title>` in JSX
- Use `next/image` for all images with explicit `width`, `height`, and `alt`
- Use `next/font` — never load fonts via a `<link>` tag

**Performance & Bundle**

- Each `"use client"` boundary increases the JS bundle — flag unnecessary ones
- Avoid barrel files (`index.ts` re-exports) — they prevent tree-shaking
- Import only what you need — never import entire icon sets
- Prefer CSS transitions over JS-driven animations for simple effects

**Accessibility**

- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<button>`) — never `<div>` for interactive elements
- All interactive elements must be keyboard-navigable with visible focus styles
- Every `<img>` needs a descriptive `alt`; use `alt=""` only for decorative images
- Icon-only buttons must have `aria-label`
- Colour contrast: 4.5:1 for normal text, 3:1 for large text (WCAG AA)

**Security**

- Never use `dangerouslySetInnerHTML` with user content
- Never put secrets in `NEXT_PUBLIC_` env vars
- Validate URLs in `href` props to prevent `javascript:` injection

## Step 4 — Return findings

Return a **numbered list of improvements, most impactful first**. For each finding:

- Short explanation of the issue
- Which file and line it appears in
- Code snippet only if it makes the fix significantly clearer

Include automated check output (lint/typecheck errors) at the top if any were found.
