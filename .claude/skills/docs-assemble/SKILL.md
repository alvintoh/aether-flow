---
name: docs-assemble
description: >
  Orchestrate all contributing agents to assemble a complete, best-practices README.md.
  Use when README.md needs a full refresh or first-time assembly.
  Dispatches architect, frontend, backend, spec, devops, and enhancement agents
  in parallel to write each section, then assembles the final document.
  Skips agents whose watched files have not changed since the last assembly.
disable-model-invocation: true
---

# README Assembler

Coordinate all contributing agents to write their section, then assemble into a
complete, accurate README.md. Skips unchanged sections to minimise token usage.

---

## Step 1: Read project context

Read the following files before doing anything else:

```
package.json              — scripts, dependencies, project name
src/app/page.tsx          — entry point, features in use
README.md                 — current state to understand what to preserve vs. replace
.claude/agents/docs.md    — README structure, ownership model, writing standards
```

Check whether these exist (note present/absent for later steps):

- `docs/diagrams/structure.svg`
- `docs/diagrams/dataflow.svg`
- `docs/diagrams/architecture.svg`
- `.env.example`
- `vercel.json`
- `.github/workflows/`
- `docs/.readme-manifest.json`

---

## Step 2: Load change manifest

Read `docs/.readme-manifest.json` if it exists. It records the last git commit
hash at which each section was assembled. Use this to determine which agents
to skip.

If the manifest does not exist, treat all sections as changed (first run).

For each section, run:

```bash
git log -1 --format="%H" -- <watched-files-for-section>
```

Compare the returned hash to the stored hash in the manifest. If they match,
the section is **unchanged** — skip its agent dispatch. If they differ or the
manifest has no entry, the section is **changed** — dispatch the agent.

### Section → watched files mapping

| Section | Watched files |
|---------|--------------|
| `getting-started` | `package.json` |
| `architecture` | `src/app/` `src/trpc/` `src/inngest/` `src/lib/` `src/features/` `prisma/` |
| `data-contracts` | `prisma/schema.prisma` `src/trpc/routers/` `docs/` |
| `env-variables` | `.env.example` `src/lib/auth.ts` `src/inngest/` |
| `deployment` | `vercel.json` `.github/workflows/` `package.json` |
| `roadmap` | `src/app/` `src/components/` `prisma/schema.prisma` |

Print a change summary before dispatching:

```
Section changes detected:
  getting-started  — CHANGED  (package.json updated)
  architecture     — unchanged (skipping)
  data-contracts   — CHANGED  (prisma/schema.prisma updated)
  env-variables    — unchanged (skipping)
  deployment       — unchanged (skipping)
  roadmap          — CHANGED  (new components detected)
```

---

## Step 3: Run `/arch-diagram` if diagrams are missing

If any of the three SVGs from Step 1 are absent, run `/arch-diagram` now to
generate them before dispatching agents.

---

## Step 4: Dispatch changed section agents in parallel

Only dispatch agents for sections marked **CHANGED** in Step 2.
Skip unchanged sections entirely — do not re-read their files or regenerate their content.

Use the **Agent tool** to spawn all changed agents simultaneously in a single message.

Each agent must:
1. Read their agent definition file for role context and writing standards
2. Read the specific source files listed in their prompt
3. Return **only** the markdown for their assigned section — no preamble, no summary

---

### Dispatch 1 — `architect` → `## Architecture`
*(skip if unchanged)*

```
You are the architect agent for the aether-flow project.

Read `.claude/agents/architect.md` for your role and standards.

Your task: Write the `## Architecture` section for README.md.

Source files to read:
- `src/app/`        — App Router structure
- `src/trpc/`       — API layer
- `src/inngest/`    — Background job functions
- `src/lib/`        — Shared infrastructure
- `src/features/`   — Feature modules
- `prisma/`         — Schema and migrations
- `docs/diagrams/structure.svg`    (include image embed if it exists)
- `docs/diagrams/dataflow.svg`     (include image embed if it exists)
- `docs/diagrams/architecture.svg` (include image embed if it exists)

The section must:
- Open with 2–3 sentences describing the layered architecture and data flow
- Describe each layer (App, Features, API, Background Execution, Infrastructure, Data)
- Include diagram image embeds only if the SVG files exist
- Note that `/arch-diagram` generates the diagrams if missing

Return the markdown section only. Start with `## Architecture`.
```

---

### Dispatch 2 — `frontend` → `## Getting started`
*(skip if unchanged)*

```
You are the frontend agent for the aether-flow project.

Read `.claude/agents/frontend.md` for your role and standards.

Your task: Write the `## Getting started` section for README.md.

Source files to read:
- `package.json` — use the exact script names and commands from the "scripts" field

The section must:
- Show `bun install` then `bun dev` as a bash code block
- Include a commands table with every script and a one-line description
- Note that `dev:all` runs both Next.js and Inngest dev server together via mprocs
- Use second person ("Run `bun dev`", not "you should run")

Return the markdown section only. Start with `## Getting started`.
```

---

### Dispatch 3 — `backend` → `## Environment variables`
*(skip if unchanged)*

```
You are the backend agent for the aether-flow project.

Read `.claude/agents/backend.md` for your role and standards.

Your task: Write the `## Environment variables` section for README.md.

Source files to read:
- `.env.example` — if it exists, derive the variable list from it
- `src/lib/auth.ts` — identify better-auth config variables
- `src/inngest/functions.ts` — identify AI model env vars
- `src/inngest/client.ts` — identify Inngest config vars

The section must:
- Include a table: Variable | Required | Description
- Cover DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, Inngest keys,
  and the three optional AI provider key + model pairs
- Note that each AI provider is only activated when its *_MODEL var is set
- End with a note to add production vars in Vercel environment settings

Return the markdown section only. Start with `## Environment variables`.
```

---

### Dispatch 4 — `spec` → `## Data contracts`
*(skip if unchanged)*

```
You are the spec agent for the aether-flow project.

Read `.claude/agents/spec.md` for your role and standards.

Your task: Write the `## Data contracts` section for README.md.

Source files to read:
- `prisma/schema.prisma` — confirm it exists and identify the ORM in use
- `src/trpc/routers/_app.ts` — confirm it exists and identify the API layer

This section is intentionally lightweight — it is a pointer to source of truth
files, not an inline API reference. Do NOT reproduce schema tables or procedure
lists in the README. Full contract documentation belongs in generated API docs
(e.g. OpenAPI via trpc-openapi, Scalar, or Redoc) when a renderer is adopted.

The section must follow this exact format:

> Full API reference not yet generated. When a spec renderer is adopted,
> this section will link to it.

| Layer | Tool | Source of truth |
|-------|------|----------------|
| Database schema | <ORM and version> | [`prisma/schema.prisma`](prisma/schema.prisma) |
| API procedures | <API layer and version> | [`src/trpc/routers/_app.ts`](src/trpc/routers/_app.ts) |
| Input validation | <validation library> | Inline per procedure |
| Generated types | <generator> | `src/generated/prisma/` — never import from `@prisma/client` |

If a spec renderer has been adopted (e.g. a docs/ folder with OpenAPI output exists),
replace the blockquote with a direct link to the rendered docs instead.

Return the markdown section only. Start with `## Data contracts`.
```

---

### Dispatch 5 — `devops` → `## Deployment`
*(skip if unchanged)*

```
You are the devops agent for the aether-flow project.

Read `.claude/agents/devops.md` for your role and standards.

Your task: Write the `## Deployment` section for README.md.

Source files to read:
- `package.json` — build scripts
- `vercel.json` — if it exists
- `.github/workflows/` — if any workflow files exist

The section must:
- Describe Vercel as the deployment target
- Include a prerequisites table (PostgreSQL provider, Inngest Cloud)
- Cover database migration steps (bun --bun run prisma migrate deploy)
- Cover Inngest Cloud registration (/api/inngest endpoint)
- If NO CI workflow exists, include a recommended minimal yaml config
  (lint + typecheck + build) noting it is not yet set up

Return the markdown section only. Start with `## Deployment`.
```

---

### Dispatch 6 — `enhancement` → `## Roadmap`
*(skip if unchanged)*

```
You are the enhancement agent for the aether-flow project.

Read `.claude/agents/enhancement.md` for your role and standards.

Your task: Write the `## Roadmap` section for README.md.

Source files to read:
- `src/app/` (glob) — understand what pages exist
- `src/components/` (glob) — understand current component set
- `prisma/schema.prisma` — understand current data model

The section must:
- Only list features genuinely NOT yet in the codebase
- Use three groups: **In progress**, **Planned**, **Stretch goals**
- Use checkbox format: `- [ ] Feature`
- Prioritise by product impact

Return the markdown section only. Start with `## Roadmap`.
```

---

## Step 5: Write docs-owned sections

Always rewrite these — they are owned by the docs agent and not change-gated:

**Project header** — project name from `package.json`, one-sentence description,
placeholder live URL if unknown.

**`## Overview`** — 2–3 sentences on what the project is, key architectural decisions,
and a bold tech stack line from the actual dependencies in `package.json`.

**`## Tech stack`** — read `dependencies` and `devDependencies` from `package.json`.
Show only the primary/main libraries — group related packages into one row where possible
(e.g. `@trpc/*`, `@ai-sdk/*`). Omit internal markers (`client-only`, `server-only`),
type packages (`@types/*`), and scaffolding tools only used at setup time.

Table format: **Package** | **Category** | **Purpose** (one sentence).

Use these categories (omit empty ones):
Framework · Language · Database & ORM · Auth · API layer · AI ·
Background jobs · Forms & validation · UI components · Styling ·
Linting · Formatting · Tooling

---

## Step 6: Assemble README.md

Merge sections in this exact order. For unchanged sections, preserve the existing
content from the current README.md verbatim — do not regenerate it.

```
# [project name]
[tagline]
[links]

## Overview
## Tech stack
## Getting started
## Architecture
## Data contracts
## Environment variables
## Deployment
## Roadmap
```

Apply docs writing standards:
- Second person for instructions
- Active voice throughout
- No marketing speak
- Code blocks for all commands
- Every section must be present even if minimal

Write the final assembled content to **`README.md`**, replacing it entirely.

---

## Step 7: Update manifest

After successfully writing README.md, update `docs/.readme-manifest.json`
with the current latest git commit hash for each section's watched files:

```bash
git log -1 --format="%H" -- <watched-files>
```

Write the manifest as:

```json
{
  "assembled": "<ISO timestamp>",
  "sections": {
    "getting-started":  { "hash": "<hash>", "files": ["package.json"] },
    "architecture":     { "hash": "<hash>", "files": ["src/app/", "src/trpc/", "src/inngest/", "src/lib/", "src/features/", "prisma/"] },
    "data-contracts":   { "hash": "<hash>", "files": ["prisma/schema.prisma", "src/trpc/routers/"] },
    "env-variables":    { "hash": "<hash>", "files": [".env.example", "src/lib/auth.ts", "src/inngest/"] },
    "deployment":       { "hash": "<hash>", "files": ["vercel.json", ".github/workflows/", "package.json"] },
    "roadmap":          { "hash": "<hash>", "files": ["src/app/", "src/components/", "prisma/schema.prisma"] }
  }
}
```

Create `docs/` directory first if it does not exist.

---

## Step 8: Summary

Report:
- Which sections were regenerated vs. skipped (unchanged)
- Estimated tokens saved by skipping unchanged sections
- Any section where an agent flagged missing source data or made an assumption
- Files that should be created (`.env.example`, `vercel.json`, `.github/workflows/ci.yml`)
