# This is NOT the Next.js you know

Next.js 16 has breaking changes — APIs, conventions, and file structure may differ from training data.
Read `node_modules/next/dist/docs/` before writing any Next.js-specific code. Heed deprecation notices.

## Commands

```bash
bun dev          # start dev server
bun build        # production build
bun lint         # biome check
bun format       # biome format --write
bun --bun run prisma [cmd]   # run prisma CLI (must use --bun flag)
```

## Stack

- **Next.js 16** + React 19 + TypeScript (strict)
- **Bun** as package manager and runtime
- **Biome** for lint + format (not ESLint/Prettier)
- **Tailwind CSS 4**
- **shadcn/ui** (`radix-nova` style, components in `src/components/ui/`)
- **Prisma 7** with PostgreSQL via `@prisma/adapter-pg`
- **tRPC v11** + `@tanstack/react-query` v5
- **React Compiler** enabled

## Key Paths

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages |
| `src/components/ui/` | shadcn UI components |
| `src/lib/db.ts` | Prisma client singleton |
| `src/generated/prisma/` | Generated Prisma client (do not edit) |
| `prisma/schema.prisma` | Database schema |
| `@/*` | Path alias for `src/*` |

## Gotchas

- **Prisma client** is generated to `src/generated/prisma/`, NOT `@prisma/client` — import from `../generated/prisma/client`
- **Prisma CLI** must be run as `bun --bun run prisma [cmd]` (not `npx prisma`)
- **DATABASE_URL** env var required for Prisma
- **Biome** handles both linting and formatting — do not add ESLint or Prettier config

## Project Agents (`.claude/agents/`)

| Agent | Purpose |
|-------|---------|
| `architecture` | Map and improve repo architecture, module boundaries, data flow |
| `backend` | Review Route Handlers, Server Actions, DB, auth, caching, security |
| `design` | Review UI layouts — spacing, typography, colour, accessibility |
| `devops` | Review CI/CD, Vercel deployment, env vars, security headers |
| `docs` | Assemble/maintain README.md, changelogs, keep docs in sync |
| `enhancement` | Plan roadmap, prioritise features, effort estimation |
| `frontend` | Review React, Next.js App Router, TypeScript, performance, a11y |
| `spec` | Define/review data contracts, TypeScript schemas, API specs |

## Project Skills (`.claude/skills/`)

| Skill | Trigger |
|-------|---------|
| `/commit-review` | Stage all changes, review, suggest commit message |
| `/fe-review` | Full frontend review — lint, typecheck, best practices |
| `/design-review` | UI/UX review of all components in `src/components/` |
| `/arch-diagram` | Generate Excalidraw architecture diagrams → `docs/diagrams/` |
| `/build-readme` | Orchestrate all agents to assemble a complete README.md |

