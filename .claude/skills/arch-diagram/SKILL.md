---
name: arch-diagram
description: >
  Generate Excalidraw architecture diagrams for the current repository.
  Use when the user asks to "diagram the architecture", "map project structure",
  "visualize module boundaries", "show data flow", or "draw system design".
  Creates 3 diagrams: folder structure, data flow, and system architecture.
  Saves output to docs/diagrams/ in the project.
disable-model-invocation: true
argument-hint: "[all|structure|dataflow|architecture]"
---

# Architecture Diagram Generator

Generate Excalidraw diagrams for the current repository, export them to SVG,
and update `README.md` — all in one run.

## Arguments

- `/arch-diagram all` — Generate all 3 diagrams (default)
- `/arch-diagram structure` — Folder/file structure only
- `/arch-diagram dataflow` — Data flow diagram only
- `/arch-diagram architecture` — System architecture only

If no argument given, generate all 3.

## Step 1: Analyze the Repository

Before drawing anything, gather context:

```bash
# Get project structure (2 levels deep, ignore noise)
find . -maxdepth 3 -type f \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -not -path '*/.next/*' \
  -not -path '*/gen/*' \
  -not -name '*.lock' \
  -not -name '*.sum' \
  | head -80

# Get directory tree (folders only)
find . -maxdepth 3 -type d \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  | sort

# Check for key config files that reveal the stack
cat package.json 2>/dev/null | head -30
cat go.mod 2>/dev/null | head -20
cat buf.yaml 2>/dev/null || cat buf.gen.yaml 2>/dev/null
ls proto/ 2>/dev/null || ls *.proto 2>/dev/null
```

Read the project's CLAUDE.md if it exists for additional context about
the architecture, conventions, and structure.

## Step 2: Create Output Directory

```bash
mkdir -p docs/diagrams
```

## Step 3: Generate Diagrams

Use the **Excalidraw MCP tool** (`create_view`) to render each diagram
inline in the conversation. Follow the Excalidraw format rules strictly.

### General Diagram Rules

- ALWAYS start with a `cameraUpdate` as the first element
- Use the Excalidraw color palette consistently:
  - Light Blue `#a5d8ff` — Frontend / UI layer
  - Light Green `#b2f2bb` — Backend / API layer
  - Light Orange `#ffd8a8` — External services / infra
  - Light Purple `#d0bfff` — Middleware / processing
  - Light Teal `#c3fae8` — Data / storage layer
  - Light Yellow `#fff3bf` — Config / definitions (like .proto files)
  - Light Red `#ffc9c9` — Generated code (don't edit)
- Use `roundness: { "type": 3 }` on all rectangles
- Minimum fontSize: 14 for body text, 16 for section headers, 20+ for diagram titles
- Use background zone rectangles (opacity: 20-30) to group related components

### CRITICAL: Text Inside Shapes

**NEVER use the `label` property on rectangles — it is not supported and silently drops all text.**

Instead, pair every rectangle with one or more separate `text` elements positioned inside it:

```json
{"type":"rectangle","id":"box1","x":100,"y":100,"width":200,"height":80,
 "strokeColor":"#339af0","backgroundColor":"#a5d8ff","fillStyle":"solid","opacity":100,"roundness":{"type":3}},
{"type":"text","id":"box1_title","x":100,"y":112,"width":200,"height":20,
 "text":"ComponentName","fontSize":16,"fontFamily":2,"textAlign":"center",
 "strokeColor":"#1971c2","backgroundColor":"transparent","fillStyle":"solid","opacity":100},
{"type":"text","id":"box1_body","x":110,"y":138,"width":180,"height":36,
 "text":"file.tsx\nhelper.ts","fontSize":13,"fontFamily":2,"textAlign":"center",
 "strokeColor":"#333","backgroundColor":"transparent","fillStyle":"solid","opacity":100}
```

Rules for text positioning:

- Title text: `y = rect.y + 10`, `x = rect.x`, `width = rect.width`, `textAlign: "center"`
- Body text: `y = title.y + title.height + 6`, same x/width, `textAlign: "center"`
- Leave at least 10px padding on all sides inside the rectangle
- Set `height` on text elements to roughly `fontSize * lineCount * 1.4`
- Use `\n` for multi-line text within a single text element
- Match text color to a darker shade of the rectangle's stroke color

---

### Diagram A: Folder Structure

**Purpose:** Show the directory layout with color-coded layers.

**Layout approach:**

- Tree/hierarchy flowing top-to-bottom or left-to-right
- Root project at top, major directories as branches
- Color-code by layer (frontend = blue, backend = green, shared = yellow)
- Mark /gen or generated folders in red with "DO NOT EDIT" annotation
- Show key files inside each directory (main entry points, config files)
- Camera: start at XL (1200x900), may need XXL for large repos

Draw each directory as a labeled rectangle. Use arrows to show
parent → child relationships. Group with translucent zone backgrounds.

---

### Diagram B: Data Flow

**Purpose:** Show how data moves through the system end-to-end.

**Layout approach:**

- Horizontal left-to-right flow
- Start from source-of-truth contracts/data definitions
- Show generation/transformation steps where relevant
- Show request and response paths through client, transport, server, and storage
- Use labeled arrows for key transitions

---

### Diagram C: System Architecture

**Purpose:** High-level birds-eye view of the entire system.

#### Pre-step: Component Drift Check

Run this before every architecture diagram regeneration — skip drawing if nothing changed.

1. **List top-level components** — glob `src/components/*.tsx` (direct children only, skip subdirectories like `figma/`)
2. **Read the existing diagram** — if `docs/diagrams/architecture.excalidraw` exists, read it and join all `text` values from `type:"text"` elements into one big string
3. **Check coverage** — for each component basename (filename without `.tsx`), check if it appears anywhere in that combined string
4. **Decide**:
   - All components present → print `Architecture diagram is up to date — skipping` and **stop here for Diagram C** (no `create_view`, no file write)
   - Any component is missing → print `New components detected: [name, ...]` and proceed with regeneration below
   - File doesn't exist yet → always generate

#### Layout approach (when regenerating)

- Layered zones: Browser Runtime → UI Components → Static Data Layer
- Show external services on the side (if applicable)
- Highlight type-safety or contract boundaries where present

---

## Step 4: Save Diagram Data

After rendering each diagram inline with the Excalidraw tool,
save the element JSON for all diagrams that were generated or updated.

Write to `docs/diagrams/`:

- `structure.excalidraw` (if structure was generated)
- `dataflow.excalidraw` (if dataflow was generated)
- `architecture.excalidraw` (if architecture was generated)

---

## Step 5: Export SVGs

For each diagram that was generated or updated in this run, export it to SVG.

Write `docs/diagrams/_gen-svg.mjs` with the following content, setting `DIAGRAMS` to only
include the diagrams that were actually regenerated:

```js
import { readFileSync, writeFileSync, existsSync } from "fs";

const DIAGRAMS = [
  {
    input: "docs/diagrams/structure.excalidraw",
    output: "docs/diagrams/structure.svg",
  },
  {
    input: "docs/diagrams/dataflow.excalidraw",
    output: "docs/diagrams/dataflow.svg",
  },
  {
    input: "docs/diagrams/architecture.excalidraw",
    output: "docs/diagrams/architecture.svg",
  },
];

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toSvg(path) {
  const data = JSON.parse(readFileSync(path, "utf-8"));
  const els = data.elements.filter((e) => e.type !== "cameraUpdate");
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const el of els) {
    if (el.x == null) continue;
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + (el.width ?? 0));
    maxY = Math.max(maxY, el.y + (el.height ?? 0));
    if (el.type === "arrow" && el.points)
      for (const [px, py] of el.points) {
        maxX = Math.max(maxX, el.x + px);
        maxY = Math.max(maxY, el.y + py);
      }
  }
  const pad = 28,
    W = Math.ceil(maxX - minX + 2 * pad),
    H = Math.ceil(maxY - minY + 2 * pad);
  const ox = -minX + pad,
    oy = -minY + pad,
    f = (n) => +n.toFixed(2);
  const rects = els
    .filter((e) => e.type === "rectangle")
    .sort((a, b) => b.width * b.height - a.width * a.height);
  const texts = els.filter((e) => e.type === "text");
  const arrows = els.filter((e) => e.type === "arrow");
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n`;
  svg += `<defs><marker id="ah" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#555"/></marker></defs>\n`;
  svg += `<rect width="${W}" height="${H}" fill="#ffffff"/>\n`;
  for (const el of rects) {
    const op = f((el.opacity ?? 100) / 100);
    svg += `<rect x="${f(el.x + ox)}" y="${f(el.y + oy)}" width="${el.width}" height="${el.height}" rx="${el.roundness ? 8 : 0}" fill="${el.backgroundColor ?? "none"}" fill-opacity="${op}" stroke="${el.strokeColor ?? "#333"}" stroke-width="1.5"/>\n`;
  }
  for (const el of texts) {
    const lines = el.text.split("\n"),
      fs = el.fontSize ?? 14,
      lh = f(fs * 1.45);
    const cx = f(el.x + ox + (el.width ?? 0) / 2),
      startY = f(el.y + oy + fs);
    svg += `<text text-anchor="middle" fill="${el.strokeColor ?? "#333"}" font-size="${fs}" font-family="system-ui,sans-serif">\n`;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim() || "\u00a0";
      svg +=
        i === 0
          ? `  <tspan x="${cx}" y="${startY}">${esc(line)}</tspan>\n`
          : `  <tspan x="${cx}" dy="${lh}">${esc(line)}</tspan>\n`;
    }
    svg += `</text>\n`;
  }
  for (const el of arrows) {
    if (!el.points || el.points.length < 2) continue;
    const pts = el.points
      .map(([px, py]) => `${f(el.x + ox + px)},${f(el.y + oy + py)}`)
      .join(" ");
    svg += `<polyline points="${pts}" fill="none" stroke="${el.strokeColor ?? "#555"}" stroke-width="${el.strokeWidth ?? 2}" marker-end="url(#ah)"/>\n`;
  }
  return svg + `</svg>`;
}

for (const { input, output } of DIAGRAMS) {
  if (!existsSync(input)) {
    console.log(`Skip: ${input}`);
    continue;
  }
  writeFileSync(output, toSvg(input), "utf-8");
  console.log(`✓ ${output}`);
}
```

Run the script, then delete it:

```bash
bun docs/diagrams/_gen-svg.mjs || node docs/diagrams/_gen-svg.mjs
rm docs/diagrams/_gen-svg.mjs
```

---

## Step 6: Update README.md

Find the existing `## Architecture` section in `README.md` (or append it before the last `##` section if absent) and ensure it contains exactly:

```markdown
## Architecture

### Folder Structure

![Folder Structure](docs/diagrams/structure.svg)

### Data Flow

![Data Flow](docs/diagrams/dataflow.svg)

### System Architecture

![System Architecture](docs/diagrams/architecture.svg)
```

Only update the image lines for diagrams that were regenerated in this run. Leave other lines untouched.

---

## Step 7: Summary

After completing all steps, report:

- Which diagrams were generated (or skipped due to drift check)
- File paths saved to `docs/diagrams/`
- A one-line description of what each diagram shows
- Any parts of the architecture that were unclear or assumed
