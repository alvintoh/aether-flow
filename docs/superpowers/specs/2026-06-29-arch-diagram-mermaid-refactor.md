# /arch-diagram → Mermaid Refactor — Design Spec

**Date:** 2026-06-29
**Skill:** `.claude/skills/arch-diagram/SKILL.md` (aether-flow project skill)
**Status:** Approved for implementation

---

## 1. Problem & Goal

The current `/arch-diagram` skill makes Claude hand-author Excalidraw element JSON
(manual x/y coordinates, box sizes, arrow elbows, label positions), then exports SVG
via a homemade script. Three structural problems make the output look unprofessional:

1. **Manual pixel placement** — LLMs place coordinates poorly, so text isn't centered,
   arrows don't meet edges, spacing is uneven. (Primary cause.)
2. **Hand-drawn aesthetic exported flat** — the Excalidraw `Virgil` font falls back to a
   generic system font on viewers; the sketch intent is lost.
3. **Excalidraw default pastel palette + inconsistent type scale (9–14px) + shadows** —
   reads as a wireframe sketch, not an architecture diagram.

Side problem: running the export script with `bun` deleted `bun.lock` once.

**Goal:** replace the pipeline with **Mermaid** — Claude writes a declarative graph,
Mermaid auto-lays-out, a brand-matched theme makes it professional, and GitHub renders
it inline. Claude never places a pixel again.

---

## 2. Locked Decisions

- **Renderer:** Mermaid (declarative + auto-layout).
- **Storage:** embed ` ```mermaid ` fenced blocks directly in `README.md` (GitHub renders
  natively). No generated `.svg`/`.excalidraw` files, no export script, no new deps.
- **Aesthetic:** brand-matched professional theme (custom Mermaid `base` theme using the
  app's `--primary` orange token + muted neutral layer tints).

---

## 3. Diagram → Mermaid Type Mapping

| Diagram | Mermaid type | Notes |
| ------- | ------------ | ----- |
| System architecture | `flowchart` (LR) with `subgraph` zones | Group by layer: Browser · Next.js · Data · External. Fan-out flows between zones. |
| Data flow | `sequenceDiagram` | Request→response lifecycle (Browser → Next → tRPC → Drizzle → PostgreSQL and back). Auth/subscription failures as `alt`/`opt` fragments. |
| Folder structure | `flowchart TD` tree | Root → top-level dirs → key subdirs, layer-colored via `classDef`. Fallback: a fenced text tree if a graph reads as cramped. |

---

## 4. Brand Theme (applied to every diagram)

Prepend this init directive + `classDef` block to each diagram. Defined ONCE in the
skill as a reusable snippet so all diagrams stay consistent. Hex values are derived from
the app's design tokens (`src/app/globals.css`) and tuned during build; the orange
approximates `--primary` `oklch(0.6397 0.172 36.44)`.

```
%%{init: {'theme':'base','themeVariables':{
  'fontFamily':'ui-sans-serif, system-ui, sans-serif',
  'primaryColor':'#fbeee7','primaryBorderColor':'#d2683f','primaryTextColor':'#5c2f17',
  'lineColor':'#9aa1ab','fontSize':'14px'}}}%%
```

Layer classes (used in flowcharts):

```
classDef app      fill:#eef2f7,stroke:#5b6b7f,color:#26303d;
classDef data     fill:#eafaf3,stroke:#2f9e7a,color:#13433a;
classDef external fill:#fff7e6,stroke:#d99a2b,color:#6b4a12;
classDef accent   fill:#fbeee7,stroke:#d2683f,color:#5c2f17;
```

Rules: one consistent font size, rounded nodes, brief labels, fixed direction per
diagram, layer grouping via `subgraph`, accent class reserved for entry/primary nodes.

---

## 5. Skill Rewrite

**Remove from SKILL.md:**
- Excalidraw MCP `create_view` usage and all per-element JSON authoring rules
- Global rules for coordinates, text positioning, shapes, the color table for fills
- Step 5 (the `_gen-svg.mjs` export script) entirely
- The drift-check that reads `.excalidraw` text elements

**Add:**
- Mermaid authoring guidance per diagram type (§3)
- The shared brand theme snippet (§4) to prepend to each diagram
- Professional-output rules (consistent shapes/labels/direction, subgraph grouping)
- A drift check based on reading the existing ` ```mermaid ` blocks in `README.md`

**Keep:** Step 1 discovery (find dirs, read `package.json` + `CLAUDE.md`), the
`all|structure|dataflow|architecture` arguments, the Step 6 README update, Step 7 summary.

**Output:** write the three ` ```mermaid ` blocks into the `## Architecture` section of
`README.md`, replacing the existing `![](docs/diagrams/*.svg)` image references.

---

## 6. Migration

- Delete `docs/diagrams/architecture.{excalidraw,svg}`, `dataflow.{excalidraw,svg}`,
  `structure.{excalidraw,svg}` (6 files).
- Replace the three image references in `README.md` `## Architecture` with inline Mermaid.
- The README sentence "Run `/arch-diagram` … to regenerate these diagrams" stays (still
  true) — update the surrounding text to reference inline Mermaid rather than SVG files.

---

## 7. Non-Goals

- No SVG/PNG export, no `@mermaid-js/mermaid-cli` dependency (embed-only).
- No change to the *content* of what the diagrams depict beyond reflecting the current
  (Drizzle) stack — this is a rendering refactor.
- No dark-mode variant of the theme (GitHub renders Mermaid; a single theme suffices).

---

## 8. Acceptance Criteria

1. `.claude/skills/arch-diagram/SKILL.md` contains no reference to Excalidraw,
   `create_view`, coordinate placement, or the SVG export script.
2. Running the skill produces three valid Mermaid blocks embedded in `README.md`'s
   `## Architecture` section, each prepended with the brand theme.
3. `docs/diagrams/` no longer contains `.excalidraw` or `.svg` files.
4. The Mermaid renders on GitHub (valid syntax) and reflects the current Drizzle stack
   (no Prisma).
5. `grep -ri prisma` over the diagrams/README stays empty.

---

## 9. Finalize notes (deviations from the original design, after visual iteration)

The shipped version refined §3–§4 after previewing renders in a real browser:

- **Theme is dark, not brand-orange.** The orange accent read as "weird" against the
  diagrams; switched to a cohesive cool dark palette: emerald (entry/UI), sky-blue
  (app/server), violet (data), muted slate (external), on a deep-navy background.
- **Data flow is a `flowchart LR` summary, not a `sequenceDiagram`.** The user wanted a
  generic left-to-right "where data flows" view, not a step-by-step sequence: a forward
  pipeline (Browser → Next.js → tRPC → Drizzle → PostgreSQL) with one dotted response arc.
- **Architecture is `flowchart TB`** (top-to-bottom) with external services as free
  nodes (cleaner edge routing than boxing them).
- **`htmlLabels:false` + NO custom `fontFamily`.** This is the critical fix for label
  clipping: a custom font makes Mermaid measure text narrower than it renders. Using the
  default font (same for measure + render) eliminates clipping. Labels are kept short.
- **`subGraphTitleMargin`** added for headroom above subgraph titles.

The living source of truth for the exact theme block and patterns is
`.claude/skills/arch-diagram/SKILL.md`.
```
