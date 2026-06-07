---
name: docs-assemble
description: >
  Orchestrate all contributing agents to assemble a complete, best-practices README.md.
  Use when README.md needs a full refresh or first-time assembly.
  Dispatches architect, frontend, spec, design, devops, and enhancement agents
  in parallel to write each section, then assembles the final document.
  Skips agents whose watched files have not changed since the last assembly.
  Self-adapts to any project via a relevance check on first run after a sync.
---

# README Assembler

Coordinate all contributing agents to write their section, then assemble into a
complete, accurate README.md. Skips unchanged sections to minimise token usage.
Automatically re-derives its own config when synced to a new project.

---

## Step 0: Relevance check (self-adaptation)

Before doing anything else, verify that this skill's hardcoded config still
matches the current project. This catches the case where `/claude-sync` copied
this skill from another project.

Run these checks:

```bash
# 1. Get the current project name
node -e "console.log(require('./package.json').name)" 2>/dev/null || cat package.json | grep '"name"' | head -1

# 2. Check whether the key watched paths from the section map actually exist
[ -d "src/app" ]        && echo "src/app: EXISTS"        || echo "src/app: MISSING"
[ -d "src/components" ] && echo "src/components: EXISTS" || echo "src/components: MISSING"
[ -d "src/data" ]       && echo "src/data: EXISTS"       || echo "src/data: MISSING"
[ -f "src/app/globals.css" ] && echo "globals.css: EXISTS" || echo "globals.css: MISSING"

# 3. Read the stored project name from the manifest (if it exists)
cat docs/.readme-manifest.json 2>/dev/null | grep '"project"' || echo "(no manifest)"
```

**Decide:**

- If the manifest has a `"project"` field that matches the current `package.json` name
  → skill is already adapted. **Skip to Step 1.**

- If the manifest is missing, has no `"project"` field, or the name does not match
  → skill needs to adapt. **Run the Discovery sub-steps below, then continue to Step 1.**

---

### Discovery (only when relevance check fails)

Analyse the project from scratch to derive section config. This runs once per
project and the result is stored in the manifest so future runs skip it.

#### D1: Map the project structure

```bash
# Framework and stack
cat package.json

# Source tree (3 levels, no noise)
find src -maxdepth 3 -type f \
  -not -path '*/node_modules/*' \
  -not -name '*.lock' \
  | sort

# Directory layout
find . -maxdepth 3 -type d \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/.next/*' \
  | sort

# Config files
ls vercel.json .env.example prisma/schema.prisma 2>/dev/null
ls .github/workflows/ 2>/dev/null
```

#### D2: Derive the section → watched-files map

From what exists, build the mapping. Rules:

| If this exists | Include this section | Watch these files |
|---|---|---|
| `src/app/` or `src/pages/` | `architecture` | all source dirs that contain components/pages |
| `src/components/` | `architecture` | add to architecture watch |
| `src/data/` or `prisma/` | `data-contracts` | `src/data/` and/or `prisma/` |
| `src/app/globals.css` or a CSS theme file | `design-system` | that file + `src/components/` |
| `vercel.json` or `.github/workflows/` | `deployment` | those files + `package.json` |
| Always | `getting-started` | `package.json` |
| Always | `roadmap` | all source dirs |

#### D3: Derive agent dispatch prompts

For each section, build a prompt that:
- Names the actual project (from `package.json` `name` field)
- Lists only the file paths that were confirmed to exist in D1
- Describes the actual architecture detected (e.g. Next.js App Router, Vite SPA, Express API)
- Matches the README section name to what fits this project

Store these derived prompts in memory for use in Step 4. They replace the
hardcoded prompts below for this run.

#### D4: Update the manifest with the new project identity

Write the project name into the manifest now so the relevance check passes
on all future runs:

```json
{ "project": "<package.json name>", ... }
```

---

## Step 1: Read project context

Read the following files:

```
package.json     — scripts, dependencies, project name
README.md        — current state to understand what to preserve vs. replace
.claude/agents/docs.md  — README structure, ownership model, writing standards
```

Check whether these exist (note present/absent for later steps):

- `docs/diagrams/structure.svg`
- `docs/diagrams/dataflow.svg`
- `docs/diagrams/architecture.svg`
- `vercel.json`
- `.github/workflows/`
- `docs/.readme-manifest.json`

---

## Step 2: Load change manifest

Read `docs/.readme-manifest.json` if it exists. It records the last git commit
hash at which each section was assembled. Use this to determine which agents
to skip.

If the manifest does not exist, treat all sections as changed (first run).

For each section in the derived section map (from Step 0, or the defaults below
if relevance check passed), run:

```bash
git log -1 --format="%H" -- <watched-files-for-section>
```

Compare the returned hash to the stored hash in the manifest. If they match,
the section is **unchanged** — skip its agent dispatch. If they differ or the
manifest has no entry, the section is **changed** — dispatch the agent.

### Default section → watched files map (aether-flow)

Used only when the relevance check passes (same project as last run):

| Section | Watched files |
|---------|--------------|
| `getting-started` | `package.json` |
| `architecture` | `src/app/` `src/features/` `src/components/` `src/trpc/` |
| `api-contracts` | `src/trpc/routers/` `prisma/schema.prisma` |
| `background-jobs` | `src/inngest/` |
| `environment-variables` | `.env.example` `prisma/schema.prisma` |
| `deployment` | `vercel.json` `.github/workflows/` `.devcontainer/` `package.json` |
| `roadmap` | `src/app/` `src/features/` |

Print a change summary before dispatching:

```
Section changes detected:
  getting-started  — unchanged (skipping)
  architecture     — CHANGED  (src/components/ updated)
  data-contracts   — unchanged (skipping)
  design-system    — CHANGED  (globals.css updated)
  deployment       — unchanged (skipping)
  roadmap          — CHANGED  (new components detected)
```

---

## Step 3: Regenerate diagrams if needed

Run `/arch-diagram` now (before dispatching section agents) if **either** condition is true:

- Any of the three SVGs from Step 1 are absent, **or**
- The `architecture` section is marked **CHANGED** in Step 2

The `arch-diagram` skill has its own component drift check and will skip individual
diagrams that are already up to date — so calling it on every architecture change is safe.
This ensures `docs/diagrams/*.excalidraw` and `docs/diagrams/*.svg` stay in sync with each other
and with the assembled README.

---

## Step 4: Dispatch changed section agents in parallel

If Discovery ran in Step 0, use the derived prompts from D3.
Otherwise use the default prompts below.

Only dispatch agents for sections marked **CHANGED** in Step 2.
Skip unchanged sections entirely.

Use the **Agent tool** to spawn all changed agents simultaneously in a single message.

Each agent must:
1. Read their agent definition file for role context and writing standards
2. Read the specific source files listed in their prompt
3. Return **only** the markdown for their assigned section — no preamble, no summary

---

### Dispatch 1 — `architecture` → `## Architecture`
*(skip if unchanged)*

```
You are the architecture agent for the aether-flow project.

Read `.claude/agents/architecture.md` for your role and standards.

Your task: Write the `## Architecture` section for README.md.

Source files to read:
- `src/app/`       — App Router pages, route groups (auth), (dashboard)
- `src/features/`  — feature modules, each owning components/hooks/server
- `src/components/` — shared UI components and shadcn primitives
- `src/trpc/`      — tRPC router wiring and client setup
- `src/lib/`       — shared utilities and singletons (db, auth)
- `docs/diagrams/structure.svg`    (include image embed if it exists)
- `docs/diagrams/dataflow.svg`     (include image embed if it exists)
- `docs/diagrams/architecture.svg` (include image embed if it exists)

The section must:
- Open with 2–3 sentences describing the full-stack feature-first architecture
- Include a Route groups table (group, path, purpose)
- Include a Key layers table (layer, path, description)
- Note the tRPC + React Query data fetching pattern
- Include diagram image embeds only if the SVG files exist
- End with: Run `/arch-diagram` in Claude Code to regenerate these diagrams if the structure changes.

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
- `package.json` — use the exact script names from the "scripts" field

The section must:
- Mention that DATABASE_URL and other env vars are required before running (link to Environment variables section)
- Show `bun install` then `bun dev` as a bash code block
- Include a commands table with all scripts from package.json
- End with: Open http://localhost:3000 in your browser.
- Use second person

Return the markdown section only. Start with `## Getting started`.
```

---

### Dispatch 3 — `spec` → `## API & tRPC contracts`
*(skip if unchanged)*

```
You are the spec agent for the aether-flow project.

Read `.claude/agents/spec.md` for your role and standards.

Your task: Write the `## API & tRPC contracts` section for README.md.

Source files to read:
- `src/trpc/routers/`  — glob all router files
- `prisma/schema.prisma` — database schema

The section must:
- Open with a description of the tRPC v11 + React Query v5 data layer
- A Routers table: Router | Procedures | Description
- A Database models table derived from prisma/schema.prisma: Model | Key fields | Relations
- A usage example showing how to call a tRPC procedure from a client component
- Note that the Prisma client is generated to `src/generated/prisma/`, not `@prisma/client`

Return the markdown section only. Start with `## API & tRPC contracts`.
```

---

### Dispatch 4 — `backend` → `## Background jobs`
*(skip if unchanged)*

```
You are the backend agent for the aether-flow project.

Read `.claude/agents/backend.md` for your role and standards.

Your task: Write the `## Background jobs` section for README.md.

Source files to read:
- `src/inngest/` — glob all function files

The section must:
- Open with a description of Inngest for durable background job processing
- A Jobs table: Function name | Trigger event | Description
- Note the INNGEST_DEV=1 env var for local development
- Note the Inngest dev server port (8288) and how to access the dashboard

Return the markdown section only. Start with `## Background jobs`.
```

---

### Dispatch 5 — `devops` → `## Deployment & CI/CD`
*(skip if unchanged)*

```
You are the devops agent for the aether-flow project.

Read `.claude/agents/devops.md` for your role and standards.

Your task: Write the `## Deployment & CI/CD` section for README.md.

Source files to read:
- `package.json`
- `vercel.json`             (if it exists)
- `.github/workflows/`      (if any files exist)
- `.devcontainer/devcontainer.json` (if it exists)

The section must:
- State Vercel is the deployment target, merging to `main` triggers production
- Note preview deployments for every PR
- Document Codespaces support if .devcontainer/ exists
- If CI workflow exists, document the pipeline steps; if not, include the recommended minimal yaml
- Note the DATABASE_URL and other env vars must be set in Vercel project settings

Return the markdown section only. Start with `## Deployment & CI/CD`.
```

---

### Dispatch 6 — `enhancement` → `## Roadmap`
*(skip if unchanged)*

```
You are the enhancement agent for the aether-flow project.

Read `.claude/agents/enhancement.md` for your role and standards.

Your task: Write the `## Roadmap` section for README.md.

Source files to read:
- `src/app/` (glob)
- `src/features/` (glob)

The section must:
- Only list features genuinely NOT yet in the codebase
- Three groups: **In progress**, **Planned**, **Stretch goals**
- Checkbox format: `- [ ] Feature`
- Prioritise by user impact

Return the markdown section only. Start with `## Roadmap`.
```

---

## Step 5: Write docs-owned sections

Always rewrite these — they are owned by the docs agent and not change-gated:

**Project header** — project name from `package.json`, one-sentence description, live URL placeholder and Architecture diagram link.

**`## Overview`** — 2–3 sentences on what the project is, key architectural decisions, and a bold tech stack line from the actual dependencies in `package.json`.

**`## Environment variables`** — read `.env.example` if it exists and derive the table from it.
If `.env.example` is absent, scan `prisma/schema.prisma` for `env()` calls and `src/lib/` for
`process.env` references to infer required variables. Write a table with columns:
Variable | Required | Description. Always include DATABASE_URL, any auth secret vars, and INNGEST_* vars.

---

## Step 6: Assemble README.md

Merge sections in this order. For unchanged sections, preserve existing content verbatim.

Use the section order that was derived in Discovery if it ran. Otherwise use this default:

```
# [project name]
[tagline + links]

## Overview
## Getting started
## Architecture
## Data contracts & schemas
## Design system
## Environment variables
## Deployment & CI/CD
## Roadmap
```

Write the final content to **`README.md`**, replacing it entirely.

---

## Step 7: Update manifest

After successfully writing README.md, update `docs/.readme-manifest.json`:

```bash
git log -1 --format="%H" -- <watched-files>
```

```json
{
  "project": "<package.json name>",
  "assembled": "<ISO timestamp>",
  "sections": {
    "getting-started":  { "hash": "<hash>", "files": ["package.json"] },
    "architecture":     { "hash": "<hash>", "files": ["src/app/", "src/components/", "src/data/"] },
    "data-contracts":   { "hash": "<hash>", "files": ["src/data/"] },
    "design-system":    { "hash": "<hash>", "files": ["src/app/globals.css", "src/components/"] },
    "deployment":       { "hash": "<hash>", "files": ["vercel.json", ".github/workflows/", "package.json"] },
    "roadmap":          { "hash": "<hash>", "files": ["src/app/", "src/components/"] }
  }
}
```

The `"project"` field is what the relevance check in Step 0 reads on the next run.

---

## Step 8: Summary

Report:
- Whether Discovery ran (new project detected) or was skipped (same project)
- Which sections were regenerated vs. skipped
- Whether `/arch-diagram` was triggered
- Any assumptions made during Discovery
