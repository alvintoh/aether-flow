# This is NOT the Next.js you know

Next.js 16 has breaking changes — APIs, conventions, and file structure may differ from training data.
Read `node_modules/next/dist/docs/` before writing any Next.js-specific code. Heed deprecation notices.

## Commands

```bash
bun dev          # start dev server
bun build        # production build
bun lint         # oxlint src/
bun lint:fix     # oxlint --fix src/
bun format       # oxfmt (format all files)
bun format:check # oxfmt --check
bun drizzle-kit [cmd]        # run drizzle-kit CLI (generate, migrate, push, studio)
```

## Stack

- **Next.js 16** + React 19 + TypeScript (strict)
- **Bun** as package manager and runtime
- **oxlint** for linting + **oxfmt** for formatting (not ESLint/Prettier/Biome)
- **Tailwind CSS 4**
- **shadcn/ui** (`radix-nova` style, components in `src/components/ui/`)
- **Drizzle ORM** with PostgreSQL (`pg` pool) — schema at `src/db/schema.ts`
- **tRPC v11** + `@tanstack/react-query` v5
- **React Compiler** enabled
- **Planned backend services**: Hono (serverless on GCP) · Elysia (Bun containers on GCP)
- **Planned IaC**: OpenTofu + GCP (handled by devops agent)

## Key Paths

| Path                         | Purpose                               |
| ---------------------------- | ------------------------------------- |
| `src/app/`                   | Next.js App Router pages              |
| `src/app/(auth)/`            | Auth route group (login, signup)      |
| `src/app/(dashboard)/`       | Dashboard route group                 |
| `src/app/api/`               | Route handlers                        |
| `src/components/`            | Shared UI components (used across features) |
| `src/components/ui/`         | shadcn primitives — do not hand-create files here |
| `src/features/[feature]/`    | Feature module root                   |
| `src/features/[feature]/components/` | Feature-specific components   |
| `src/features/[feature]/hooks/`      | Feature-specific hooks        |
| `src/features/[feature]/server/`     | Feature server-side code      |
| `src/hooks/`                 | Shared custom hooks (used across features) |
| `src/lib/`                   | Shared utilities and singletons       |
| `src/trpc/routers/`          | tRPC router definitions               |
| `src/inngest/`               | Inngest background job functions      |
| `src/db/schema.ts`           | Drizzle schema — tables, enums, relations |
| `drizzle.config.ts`          | Drizzle Kit config                    |
| `@/*`                        | Path alias for `src/*`                |

## Folder Conventions

These rules are enforced by Lefthook. Follow them when placing any new file.

### `src/app/` — Next.js reserved files only

Only these filenames are allowed directly inside `src/app/**`:

`page.tsx` · `layout.tsx` · `error.tsx` · `loading.tsx` · `not-found.tsx` · `template.tsx` · `default.tsx` · `route.ts`

**Never place components, hooks, or utilities directly inside `src/app/`.**

### `src/features/` — feature-first organisation

All feature-specific code lives under `src/features/[feature]/`. A feature owns its components, hooks, and server code. Do not scatter feature code into `src/components/` or `src/lib/`.

### `src/components/` — truly shared components only

Only place a component here if it is used by **2 or more features**. If it belongs to one feature, it goes in `src/features/[feature]/components/`.

### `src/hooks/` — shared hooks only

Custom hooks (`useX.ts`) must live in `src/hooks/` (shared) or `src/features/[feature]/hooks/` (feature-scoped). Never place hook files in `src/lib/`, `src/app/`, or `src/` root.

### `src/lib/` — utilities and singletons only

Shared utilities, clients, and singletons (e.g. `db.ts`, `auth.ts`). No components, no hooks, no feature logic.

## Gotchas

- **DB client** lives in `src/lib/db.ts`, schema in `src/db/schema.ts` — import `db` from `@/lib/db`, tables/types from `@/db/schema`
- **Drizzle CLI**: `bun drizzle-kit [generate|migrate|push|studio]`
- **DATABASE_URL** env var required for Drizzle
- **oxlint** handles linting, **oxfmt** handles formatting — do not add ESLint, Prettier, or Biome config

## Project Agents (`.claude/agents/`)

| Agent          | Purpose                                                            |
| -------------- | ------------------------------------------------------------------ |
| `architecture` | Map and improve repo architecture, module boundaries, data flow    |
| `backend`      | Review Hono (serverless), Elysia (containers), tRPC routers, Drizzle, auth, security |
| `ci`           | Set up and review quality pipeline — GitHub Actions, Lefthook, branch protection |
| `design`       | Review UI layouts — spacing, typography, colour, accessibility     |
| `devops`       | Review Vercel deployment, GCP Cloud Run, OpenTofu IaC, env vars, security headers |
| `docs`         | Assemble/maintain README.md, changelogs, keep docs in sync         |
| `dx`           | Review Codespaces, devcontainer, mprocs, Bun setup, onboarding speed  |
| `enhancement`  | Plan roadmap, prioritise features, effort estimation               |
| `frontend`     | Review React, Next.js App Router, TypeScript, performance, a11y    |
| `publish`      | Publish docs to external platforms — Mintlify, Notion, company wiki    |
| `qa`           | Identify bugs, regressions, and quality issues                         |
| `spec`         | Define/review data contracts, TypeScript schemas, API specs        |

## Project Skills (`.claude/skills/`)

| Skill                | Description                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| `/arch-diagram`      | Generate Excalidraw architecture diagrams → `docs/diagrams/`            |
| `/bug-fix`           | Surgically fix a specific bug — reads only affected files, min change   |
| `/ci-setup`          | Bootstrap the full quality pipeline — GitHub Actions, Lefthook, branch protection, CodeRabbit |
| `/code-refactor`     | Structural improvements to existing code — no behaviour changes         |
| `/design-review`     | UI/UX review of all components in `src/components/`                     |
| `/docs-assemble`     | Orchestrate all agents to assemble a complete README.md                 |
| `/feature-create`    | Scaffold and build a new frontend feature following project conventions  |
| `/frontend-review`   | Full frontend review — lint, typecheck, best practices                  |
| `/issue-create`      | File any bug or finding as a structured GitHub issue via `gh issue create` |
| `/issue-resolve`     | Pick an open GitHub issue, fix it, commit with `Fixes #N`, then push or open PR |
| `/library-evaluate`  | Evaluate adding or replacing a lib/tool — Go / Conditional Go / Not Needed / No-Go |
