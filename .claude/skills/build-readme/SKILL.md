---
name: build-readme
description: >
  Orchestrate all contributing agents to assemble a complete, best-practices README.md.
  Use when README.md needs a full refresh or first-time assembly.
  Dispatches architect, frontend, backend, design, spec, devops, and enhancement
  agents in parallel to write each section, then assembles the final document.
disable-model-invocation: true
---

# README Builder

Coordinate all contributing agents to write their section, then assemble into a
complete, accurate README.md that follows best practices.

---

## Step 1: Read project context

Read the following files before dispatching any agents. You need this context to
write the docs-owned sections and to verify agent outputs are accurate.

```
package.json              — scripts, dependencies, project name
src/app/globals.css       — actual theme token values
src/app/page.tsx          — entry point, features in use
README.md                 — current state to understand what to preserve vs. replace
.claude/agents/docs.md    — README structure, ownership model, writing standards
```

Also glob `src/data/` to list all data files.

Check whether these exist (note present/absent for Step 3):
- `docs/diagrams/structure.svg`
- `docs/diagrams/dataflow.svg`
- `docs/diagrams/architecture.svg`
- `.env.example`
- `vercel.json`
- `.github/workflows/`

---

## Step 2: Run `/arch-diagram` if diagrams are missing

If any of the three SVGs from Step 1 are absent, run `/arch-diagram` now to
generate them before dispatching agents. The architect agent's section depends
on these files existing.

---

## Step 3: Dispatch all section agents in parallel

Use the **Agent tool** to spawn all 7 agents simultaneously. Do not wait for
one before starting the next — all dispatches go in a single message.

Each agent must:
1. Read their agent definition file for role context and writing standards
2. Read the specific source files listed in their prompt for accurate, current data
3. Return **only** the markdown for their assigned section — no preamble, no summary

---

### Dispatch 1 — `architect` → `## Architecture`

```
You are the architect agent for this Next.js portfolio project.

Read `.claude/agents/architect.md` for your role and standards.

Your task: Write the `## Architecture` section for README.md.

Source files to read:
- `docs/diagrams/structure.svg`   (confirm it exists)
- `docs/diagrams/dataflow.svg`    (confirm it exists)
- `docs/diagrams/architecture.svg` (confirm it exists)

The section must:
- Open with 1–2 sentences describing the layered architecture
  (App Router → UI components → static data layer)
- Include three subsections with markdown image embeds:
  ### Folder Structure
  ![Folder Structure](docs/diagrams/structure.svg)
  ### Data Flow
  ![Data Flow](docs/diagrams/dataflow.svg)
  ### System Architecture
  ![System Architecture](docs/diagrams/architecture.svg)

Return the markdown section only. Start with `## Architecture`.
```

---

### Dispatch 2 — `frontend` → `## Getting Started`

```
You are the frontend agent for this Next.js portfolio project.

Read `.claude/agents/frontend.md` for your role and standards.

Your task: Write the `## Getting Started` section for README.md.

Source files to read:
- `package.json` — use the exact script names and commands from the "scripts" field

The section must:
- Show the install + dev commands as a bash code block (use bun)
- Include a commands table with every script in package.json and a one-line description
- Be testable — only include commands that actually work

Return the markdown section only. Start with `## Getting Started`.
```

---

### Dispatch 3 — `backend` → `## Environment Variables`

```
You are the backend agent for this Next.js portfolio project.

Read `.claude/agents/backend.md` for your role and standards.

Your task: Write the `## Environment Variables` section for README.md.

Source files to read:
- `package.json` — for project context
- `.env.example` — if it exists, list all variables from it

The section must:
- State clearly whether env vars are required for local development
- If none are required, say so explicitly (do not omit the section)
- If `.env.example` exists, include a table with variable name, required/optional,
  and a description for each
- Mention where to add variables for production (Vercel environment settings)

Return the markdown section only. Start with `## Environment Variables`.
```

---

### Dispatch 4 — `design` → `## Design System`

```
You are the design agent for this Next.js portfolio project.

Read `.claude/agents/design.md` for your role and standards.

Your task: Write the `## Design System` section for README.md.

Source files to read:
- `src/app/globals.css` — read the ACTUAL current token values from :root and
  :root[data-theme="light"]; do not guess or use placeholder values

The section must:
- Explain that tokens are CSS custom properties in globals.css, accessed via
  Tailwind's @theme inline
- Include a token table with the real values from globals.css for both dark and
  light mode: --background, --foreground, --accent, --surface (at minimum)
- Note that dark mode is the default; light mode via data-theme="light"
- Mention the transition on background-color and color for smooth theme switching

Return the markdown section only. Start with `## Design System`.
```

---

### Dispatch 5 — `spec` → `## Data Contracts & Schemas`

```
You are the spec agent for this Next.js portfolio project.

Read `.claude/agents/spec.md` for your role and standards.

Your task: Write the `## Data Contracts & Schemas` section for README.md.

Source files to read:
- All files in `src/data/` — read each one to find the exported TypeScript
  type/interface names and understand the shape of the data

The section must:
- Explain that all content is static TypeScript — no runtime fetching
- Include a table: File | Exported Type | Description
  with one row per file in src/data/, using the actual type names from the source
- Note any conventions (e.g. all arrays are readonly, optional fields)

Return the markdown section only. Start with `## Data Contracts & Schemas`.
```

---

### Dispatch 6 — `devops` → `## Deployment & CI/CD`

```
You are the devops agent for this Next.js portfolio project.

Read `.claude/agents/devops.md` for your role and standards.

Your task: Write the `## Deployment & CI/CD` section for README.md.

Source files to read:
- `package.json` — build scripts
- `vercel.json` — if it exists
- `.github/workflows/` — if any workflow files exist

The section must:
- Describe the current deployment platform (Vercel)
- If a GitHub Actions workflow exists, describe the CI checks it runs
- If NO CI workflow exists, include a recommended minimal workflow (lint +
  typecheck + build) as a yaml code block with a note that it's not yet set up
- Include a one-click Vercel deploy badge (use the standard markdown badge format)

Return the markdown section only. Start with `## Deployment & CI/CD`.
```

---

### Dispatch 7 — `enhancement` → `## Roadmap`

```
You are the enhancement agent for this Next.js portfolio project.

Read `.claude/agents/enhancement.md` for your role and standards.

Your task: Write the `## Roadmap` section for README.md.

Source files to read:
- `src/app/page.tsx` — understand what is already implemented
- `src/data/` (glob) — understand current content structure
- `src/components/` (glob) — understand current component set

The section must:
- List genuinely missing features as "Planned" checkboxes (not things already built)
- Prioritise by recruiter/hiring impact (highest impact first)
- Use three groups: **In progress**, **Planned**, **Stretch goals**
- Be honest — do not list features already present in the codebase

Return the markdown section only. Start with `## Roadmap`.
```

---

## Step 4: Write docs-owned sections

While waiting for agents or after collecting results, write the two sections you
own as the docs agent:

**Project header** — use the project name from `package.json`, write a one-sentence
description based on what you learned in Step 1. Leave the live site URL as a
placeholder if unknown: `[Live site](https://yourname.dev)`.

**`## Overview`** — 2–3 sentences on what the project is, the key architectural
decision (static data + fixed sidebar), and a bold tech stack line derived from
the actual dependencies in `package.json`.

---

## Step 5: Assemble README.md

Combine all sections in this exact order:

```
# [project name]

[tagline — one sentence]

[Live site](https://yourname.dev) · [Architecture](docs/diagrams/architecture.svg)

## Overview
## Getting Started
## Architecture
## Data Contracts & Schemas
## Design System
## Environment Variables
## Deployment & CI/CD
## Roadmap
```

Apply the docs agent's writing standards before writing:
- Second person for instructions (`Run bun dev`, not `The developer should run`)
- Active voice throughout
- No marketing speak
- Code blocks for all commands and multi-line snippets
- Every section must be present even if minimal
- Remove any placeholder text that has been resolved by agent outputs

Write the final assembled content to **`README.md`**, replacing it entirely.

---

## Step 6: Summary

Report:
- Which agents contributed which sections
- Any section where an agent flagged missing source data or made an assumption
- Files that don't exist yet but should (e.g. `.env.example`, `vercel.json`,
  `.github/workflows/ci.yml`) — list them so the user can create them
