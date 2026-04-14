# aether-flow

AI-powered workflow automation platform — build, run, and observe multi-step AI workflows across multiple providers.

[Live site](https://yoursite.dev) · [Architecture](docs/diagrams/architecture.svg)

---

## Overview

Aether Flow is an early-stage workflow automation platform where users compose and execute multi-step AI jobs across Google, OpenAI, and Anthropic. Auth and workflow state are persisted in PostgreSQL via Prisma. Long-running AI executions are offloaded to Inngest background jobs, keeping the HTTP layer fast and giving each run full observability and retry support. The API surface is fully typed end-to-end via tRPC v11.

**Stack:** Next.js 16 · React 19 · TypeScript · tRPC v11 · Prisma 7 · better-auth · Inngest · Tailwind CSS v4

---

## Tech stack

| Package | Category | Purpose |
|---------|----------|---------|
| `next` | Framework | App Router, server components, API routes |
| `react` | Framework | UI rendering, React 19 with compiler enabled |
| `typescript` | Language | Strict type checking across the full stack |
| `prisma` / `@prisma/adapter-pg` | Database & ORM | Schema-first PostgreSQL with Prisma 7 |
| `pg` | Database & ORM | PostgreSQL driver used by the Prisma adapter |
| `better-auth` | Auth | Session-based authentication with email/password |
| `@trpc/*` | API layer | End-to-end typed RPC between server and client |
| `@tanstack/react-query` | API layer | Server state management and mutation handling |
| `ai` | AI | Vercel AI SDK core — unified interface for text generation |
| `@ai-sdk/*` | AI | Provider adapters for Google, OpenAI, and Anthropic |
| `inngest` | Background jobs | Durable multi-step workflow execution with retries and observability |
| `zod` | Forms & validation | Schema validation and input type inference |
| `react-hook-form` / `@hookform/resolvers` | Forms & validation | Form state management with Zod integration |
| `radix-ui` | UI components | Accessible, unstyled primitive components |
| `lucide-react` | UI components | Icon set |
| `sonner` | UI components | Toast notifications |
| `tailwindcss` | Styling | Utility-first CSS framework (v4) |
| `tailwind-merge` / `clsx` | Styling | Safe class merging and conditional class construction |
| `class-variance-authority` | Styling | Typed variant API for component styles |
| `oxlint` | Linting | Fast Rust-based linter with ESLint-compatible rules |
| `oxfmt` | Formatting | Fast Rust-based formatter, Prettier-compatible output |
| `inngest-cli` | Tooling | Local Inngest Dev Server for development |
| `mprocs` | Tooling | Run multiple dev processes in one terminal |

---

## Getting started

```bash
bun install   # install dependencies
bun dev       # start dev server → http://localhost:3000
```

| Command | Description |
|---------|-------------|
| `bun dev` | Start the Next.js development server |
| `bun build` | Build the application for production |
| `bun start` | Start the production server |
| `bun lint` | Lint source files with oxlint |
| `bun lint:fix` | Lint and auto-fix source files with oxlint |
| `bun format` | Format source files with oxfmt |
| `bun format:check` | Check formatting without writing changes |
| `bun inngest:dev` | Start the Inngest dev server |
| `bun dev:all` | Run the Next.js dev server and Inngest dev server together via mprocs |

To run the full local stack in one terminal, use `bun dev:all`. This starts both the Next.js dev server and the Inngest dev server concurrently via [mprocs](https://github.com/pvolok/mprocs). Logs are written to `mprocs.log`.

---

## Architecture

Aether Flow is organized as a strict three-layer system: the Next.js App Router handles request routing and page composition, tRPC procedures enforce typed API contracts between the client and server, and Prisma with Inngest split responsibility for persistent storage and background AI execution respectively. Dependencies flow one way — UI calls tRPC, tRPC writes to the database or dispatches Inngest events, and Inngest runs AI workloads in isolation. No layer imports upward.

**App layer (`src/app/`)** — Next.js 16 App Router pages and layouts. Route segments own page-level data fetching and server component composition. Client components are scoped to interactive leaves only, keeping the default render path server-side.

**Feature modules (`src/features/`)** — Self-contained vertical slices colocating UI, hooks, and logic for a bounded domain. Currently hosts `auth`, with each future feature expected to follow the same structure.

**API layer (`src/trpc/`)** — tRPC v11 routers define the typed RPC surface consumed by React Query on the client. Procedures are the sole entry point for mutations; they either write to the database via Prisma or send an event to Inngest for deferred execution.

**Background execution layer (`src/inngest/`)** — Inngest functions receive workflow events and run multi-step AI jobs using `step.ai.wrap()`. This decouples long-running AI calls from the HTTP request lifecycle and provides built-in retries, observability, and step-level replays. The active AI provider is resolved at runtime from environment variables, keeping the function code provider-agnostic.

**Infrastructure (`src/lib/`)** — Shared singletons: the Prisma client (`db.ts`), better-auth configuration (`auth.ts`), and utility helpers. No knowledge of UI or routing.

**Data persistence (`prisma/`)** — Schema-first PostgreSQL via Prisma 7. The generated client lives in `src/generated/prisma/` and is imported only through `src/lib/db.ts`.

To generate visual diagrams of the folder structure, composition tree, and data flow, run `/arch-diagram`. Diagrams are written to `docs/diagrams/`.

---

## Data contracts

> Full API reference not yet generated. When a spec renderer is adopted, this section will link to it.

| Layer | Tool | Source of truth |
|-------|------|----------------|
| Database schema | Prisma 7 | [`prisma/schema.prisma`](prisma/schema.prisma) |
| API procedures | tRPC v11 | [`src/trpc/routers/_app.ts`](src/trpc/routers/_app.ts) |
| Input validation | Zod v4 | Inline per procedure |
| Generated types | Prisma client | `src/generated/prisma/` — never import from `@prisma/client` |

---

## Environment variables

Copy `.env.example` to `.env.local` for local development. Never commit `.env.local`.

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Random secret for session signing — `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Yes | Canonical base URL, e.g. `http://localhost:3000` |
| `INNGEST_EVENT_KEY` | Production | Inngest ingest key from the Inngest Cloud dashboard |
| `INNGEST_SIGNING_KEY` | Production | Inngest signing key for webhook verification |
| `INNGEST_DEV` | Local only | Set to `1` to connect to the local Inngest Dev Server. Omit in production. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional | Required when `GOOGLE_MODEL` is set |
| `GOOGLE_MODEL` | Optional | Google model ID, e.g. `gemini-2.5-flash-lite` |
| `OPENAI_API_KEY` | Optional | Required when `OPENAI_MODEL` is set |
| `OPENAI_MODEL` | Optional | OpenAI model ID, e.g. `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` | Optional | Required when `ANTHROPIC_MODEL` is set |
| `ANTHROPIC_MODEL` | Optional | Anthropic model ID, e.g. `claude-haiku-4-5-20251001` |

The `*_MODEL` variables are independent — each provider is only activated when its model variable is present. For production, add all variables under **Vercel > Project > Settings > Environment Variables**.

---

## Deployment

Deployed on [Vercel](https://vercel.com). Merging to `main` triggers a production deployment automatically.

### Prerequisites

| Service | Purpose | Recommended providers |
|---------|---------|----------------------|
| PostgreSQL | Primary database | [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app) |
| Inngest Cloud | Background job processing | [inngest.com](https://www.inngest.com) |

### Database migrations

Migrations do not run automatically on deploy. Run them before each deployment that includes schema changes:

```bash
DATABASE_URL="<production-url>" bun --bun run prisma migrate deploy
```

Never run `prisma migrate dev` against a production database.

### Inngest

Register the app's event handler URL with Inngest Cloud under **Apps**:

```
https://<your-vercel-domain>/api/inngest
```

### CI/CD

No workflow file exists yet. Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - name: Install dependencies
        run: bun install --frozen-lockfile
      - name: Lint
        run: bun lint
      - name: Typecheck
        run: bun tsc --noEmit
      - name: Build
        run: bun build
```

---

## Roadmap

### In progress

- [ ] Workflow steps/nodes schema — data model for individual steps within a workflow
- [ ] AI prompt configuration per workflow — attach provider, model, and prompt template to a workflow

### Planned

- [ ] Workflow builder UI — visual node editor for composing multi-step workflows
- [ ] Workflow execution history — per-run log viewer surfacing Inngest event data and step outputs
- [ ] Webhook triggers — inbound HTTP endpoints that fire a workflow
- [ ] Workflow scheduling — cron-based and delay-based triggers
- [ ] API key management UI — CRUD interface for user-scoped provider keys
- [ ] Execution status indicators — real-time run status via polling or server-sent events

### Stretch goals

- [ ] Team and organisation support — multi-member workspaces with role-based access control
- [ ] Workflow versioning — immutable snapshots with rollback support
- [ ] Conditional branching — if/else and switch nodes within the step graph
- [ ] Workflow templates — shareable, forkable workflow definitions
- [ ] Audit log — append-only record of workflow edits and execution events
- [ ] CLI — `aether-flow run <workflow-id>` for headless invocation from CI pipelines
