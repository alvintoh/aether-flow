---
name: frontend-review
description: Review all frontend components in src/app/ and src/features/ against TypeScript, React, Next.js App Router, performance, accessibility, and security best practices. Captures Chrome console errors first, runs lint and typecheck, then Grep-first pattern matching before reading files — returns a prioritised findings list.
---

# Frontend Code Review

Structured frontend review of this Next.js + TypeScript + Tailwind project.
Use Grep to find anti-patterns first — read a file only when Grep confirms an issue.
This keeps the review fast and focused on real problems.

---

## Step 1 — Live runtime signal (Chrome MCP)

Before any static analysis, capture what the browser is actually reporting:

```
mcp__plugin_chrome-devtools-mcp_chrome-devtools__list_console_messages — errors, warnings, uncaught exceptions
mcp__plugin_chrome-devtools-mcp_chrome-devtools__list_network_requests — failed requests (tRPC errors, 4xx/5xx, CORS)
```

Record these as **[RUNTIME]** findings — they are highest priority because they affect users
right now. If Chrome MCP is not connected, note that runtime errors could not be verified.

---

## Step 2 — Automated static checks

```bash
bun lint
bunx tsc --noEmit
```

Record all errors and warnings as **[LINT]** or **[TYPE]** findings.

---

## Step 3 — Grep-first pattern review

Search for anti-patterns across the codebase **before reading any file in full**.
For each pattern, collect the matching file paths. Only read a file if it matches.

**Client boundary**
```
Grep: "use client"  glob: src/**/*.{ts,tsx}   → flag files using it unnecessarily
```
For each match, read the file to check: does it actually use hooks, event handlers, or
browser APIs? If not, flag it as an unnecessary `"use client"`.

**`any` usage**
```
Grep: ": any|as any|<any"  glob: src/**/*.{ts,tsx}  output: files_with_matches
```
Read only the matching files to confirm the `any` is not in a comment or generated code.

**Inline object/array/function in JSX props**
```
Grep: "=\{\{|=\{\[|=\{(" glob: src/**/*.tsx  output: files_with_matches
```
Read matches and confirm they are genuinely inline (not variable references).

**`useEffect` for derived state**
```
Grep: "useEffect" glob: src/features/**/*.{ts,tsx}  output: files_with_matches
```
Read matches and check if any `useEffect` sets state that could be computed during render.

**Missing `alt` on images**
```
Grep: "<img " glob: src/**/*.tsx  output: files_with_matches
```
Read matches and confirm `alt` is present.

**`dangerouslySetInnerHTML`**
```
Grep: "dangerouslySetInnerHTML" glob: src/**/*.tsx  output: files_with_matches
```
Flag all matches — always requires review.

**`NEXT_PUBLIC_` secrets**
```
Grep: "NEXT_PUBLIC_" glob: src/**/*.{ts,tsx}  output: files_with_matches
```
Read matches and confirm none contain sensitive values (tokens, keys, secrets).

**Barrel file imports (tree-shaking risk)**
```
Grep: "from.*index" glob: src/**/*.{ts,tsx}  output: files_with_matches
```

---

## Step 4 — Targeted file reads

After Step 3, read these specific files (they always need a human eye and Grep can't
fully capture their issues):

- `src/app/layout.tsx` — metadata, font loading, provider wrapping
- `src/app/page.tsx` — top-level page structure, section ordering
- Any `src/trpc/` files flagged by previous steps

Read with `limit` set to avoid loading more than needed from large files.

---

## Step 5 — Compile findings

Group by severity — **[RUNTIME]** > **[TYPE]** > **[LINT]** > **[PATTERN]**:

**TypeScript**
- `any` usage → replace with `unknown` + narrowing
- Type assertions (`as Foo`) → fix the underlying type
- Inferred JSX prop types → type explicitly

**React & Hooks**
- `useEffect` for derived state → compute during render
- Inline object/array/function in JSX props → hoist or memoize
- Index keys in lists → use stable IDs
- Complex multi-`useState` → consolidate with `useReducer`

**Next.js App Router**
- Unnecessary `"use client"` → push boundary down or remove
- Hardcoded `<title>` in JSX → use `generateMetadata`
- `<img>` instead of `next/image` → migrate
- `<link>` for fonts → use `next/font`

**Performance & Bundle**
- Barrel file imports → import from source directly
- Heavy components without `next/dynamic` → lazy-load

**Accessibility**
- `<div>` for interactive elements → use semantic HTML
- Missing `aria-label` on icon buttons
- Missing or generic `alt` text on images
- Colour contrast below 4.5:1

**Security**
- `dangerouslySetInnerHTML` with unsanitised content
- `NEXT_PUBLIC_` exposing secrets
- Unvalidated URLs in `href` props

---

## Step 6 — Return findings

Numbered list, most impactful first. For each finding:

- **Severity** tag: `[RUNTIME]` / `[TYPE]` / `[LINT]` / `[PATTERN]`
- One-line description of the issue
- File path and line number
- Code snippet only if it makes the fix significantly clearer

Include the Chrome MCP runtime errors at the top if any were found. End with a summary
count: `N issues found — X runtime, Y type/lint, Z pattern`.
