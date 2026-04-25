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

Generate Excalidraw diagrams, export SVGs, and update `README.md` in one run.

## Arguments

- `/arch-diagram all` — All 3 diagrams (default if no arg given)
- `/arch-diagram structure` — Folder structure only
- `/arch-diagram dataflow` — Data flow only
- `/arch-diagram architecture` — System architecture only

---

## Step 1: Discover

```bash
find . -maxdepth 3 -type d \
  -not -path '*/node_modules/*' -not -path '*/.git/*' \
  -not -path '*/dist/*' -not -path '*/.next/*' | sort
cat package.json 2>/dev/null | head -20
```

Also read `CLAUDE.md` if present.

---

## Step 2: Create Output Dir

```bash
mkdir -p docs/diagrams
```

---

## Step 3: Draw Diagrams

Use `create_view` (Excalidraw MCP). Build each diagram **section-by-section** — never generate an entire complex diagram in one shot; it produces worse layout and risks hitting output limits.

### Global Rules

- First element: always `cameraUpdate`
- `roughness: 0`, `strokeWidth: 2` (shapes/arrows), `strokeWidth: 1` (dividers)
- `opacity: 100` on all elements; zone backgrounds: `opacity: 20`
- Rectangles: `roundness: {"type": 3}`
- Font: body `fontSize: 14`, headers `16`, titles `20+`, `fontFamily: 1`, `textAlign: "center"`
- Text height: `fontSize × lineCount × 1.4`
- **Never** use the `label` property on rectangles — pair each rect with separate `text` elements
- Text inside rect: title `y = rect.y + 10`, body `y = title.y + title.height + 6`, same `x`/`width` as rect; 10px padding all sides

### Colors

| Layer | Background | Stroke |
|-------|-----------|--------|
| Frontend / Browser | `#a5d8ff` | `#1971c2` |
| Backend / API | `#b2f2bb` | `#2f9e44` |
| External / Infra | `#ffd8a8` | `#e67700` |
| Middleware / Processing | `#d0bfff` | `#6741d9` |
| Data / Storage | `#c3fae8` | `#0c8599` |
| Config / Definitions | `#fff3bf` | `#e67700` |
| Generated (DO NOT EDIT) | `#ffc9c9` | `#c92a2a` |

### Shapes

| Concept | Shape |
|---------|-------|
| Labels, descriptions, detail text | free-floating `text` (default) |
| Section / zone title | free-floating `text` (larger font) |
| Process step, named module | `rectangle` |
| Decision / branch | `diamond` |
| Origin / trigger / endpoint | `ellipse` |
| Layer grouping zone | large `rectangle`, `opacity: 20` |

### Patterns

| Pattern | Use for |
|---------|---------|
| **Tree** | Hierarchy — vertical trunk `line` + horizontal branch `line`s + free-floating text. No boxes. |
| **Swimlane** | Data flow — stacked horizontal zone rows, arrows flow left→right through/between rows |
| **Zone layout** | Architecture — translucent background rects grouping components by layer |
| **Fan-out** | One source → many targets — central element, arrows radiating out |
| **Timeline** | Sequence — horizontal line + small dot `ellipse`s (10–20px) + free-floating labels |

---

### Diagram A: Folder Structure

**Goal**: Show the directory hierarchy, color-coded by architectural layer.

**Macro-first**: If the repo has >30 files, show **directories only** — no individual files.
Add `(N files)` counts inline. Limit depth to 2 levels below `src/`.

**Pattern**: Tree
- Trunk = vertical `line`; branches = horizontal `line`s; labels = free-floating `text`
- Color-code each branch by its layer using the palette
- Mark generated dirs (`src/generated/`, `/gen`) in red with a "DO NOT EDIT" annotation
- Camera: 1200×900 minimum; scale up for large repos

---

### Diagram B: Data Flow

**Goal**: Show a complete request/response cycle end-to-end.

**Pattern**: Horizontal swimlane — stacked zone rows (top → bottom = client → server → storage), arrows flow left-to-right for requests, right-to-left (dashed) for responses.

**Standard rows** (adapt to the actual stack):
1. **Browser** (`#a5d8ff`, 20%) — user action, UI rendering
2. **Next.js Server** (`#b2f2bb`, 20%) — RSC, Server Actions, Route Handlers
3. **API / Middleware** (`#d0bfff`, 20%) — tRPC, auth, validation
4. **ORM** (`#c3fae8`, 20%) — Prisma queries, transactions
5. **Storage / External** (`#ffd8a8`, 20%) — PostgreSQL, third-party APIs

Rules:
- ≤ 5 nodes per row — collapse similar steps into one
- Request arrows: solid, labeled (e.g. `"HTTP POST /api/trpc"`, `"prisma.user.findMany()"`)
- Response arrows: `strokeStyle: "dashed"`, labeled with return value type
- Show happy path only; omit error branches
- Zone row label (large bold text) pinned to the left edge of each row

---

### Diagram C: System Architecture

**Goal**: Bird's-eye view of the entire system.

#### Drift Check (skip if unchanged)

1. `Glob src/components/*.tsx` — collect component basenames
2. If `docs/diagrams/architecture.excalidraw` exists, read it; join all `type:"text"` element values
3. Every component name present → print `Architecture diagram is up to date — skipping` and stop
4. Otherwise regenerate

#### Layout

**Pattern**: Zone layout — translucent layer zones (Browser → UI → Server → DB), fan-out flows between zones. Place external services (auth, billing, DB) on the right. Highlight type-safety/contract boundaries.

---

## Step 4: Save Diagrams

Write element JSON to `docs/diagrams/`:
- `structure.excalidraw`, `dataflow.excalidraw`, `architecture.excalidraw`

Only write files for diagrams generated this run.

---

## Step 5: Export SVGs

Write, run, then delete this script:

```js
// docs/diagrams/_gen-svg.mjs
import{readFileSync,writeFileSync,existsSync}from"fs";
const D=[["docs/diagrams/structure.excalidraw","docs/diagrams/structure.svg"],["docs/diagrams/dataflow.excalidraw","docs/diagrams/dataflow.svg"],["docs/diagrams/architecture.excalidraw","docs/diagrams/architecture.svg"]];
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const f=n=>+n.toFixed(2);
function toSvg(path){
  const E=JSON.parse(readFileSync(path,"utf-8")).elements.filter(e=>e.type!=="cameraUpdate");
  let[mx,my,Mx,My]=[Infinity,Infinity,-Infinity,-Infinity];
  for(const e of E){
    if(e.x==null)continue;
    mx=Math.min(mx,e.x);my=Math.min(my,e.y);
    Mx=Math.max(Mx,e.x+(e.width??0));My=Math.max(My,e.y+(e.height??0));
    if(e.type==="arrow"&&e.points)for(const[px,py]of e.points){Mx=Math.max(Mx,e.x+px);My=Math.max(My,e.y+py);}
  }
  const pad=32,W=Math.ceil(Mx-mx+2*pad),H=Math.ceil(My-my+2*pad),ox=-mx+pad,oy=-my+pad;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="font-family:Virgil,'Segoe UI',system-ui,-apple-system,sans-serif;">\n<defs><marker id="ah" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="#555"/></marker><filter id="shadow" x="-5%" y="-5%" width="115%" height="115%"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#00000018"/></filter></defs>\n<rect width="${W}" height="${H}" fill="#f8f9fa" rx="4"/>\n`;
  for(const e of E.filter(e=>e.type==="rectangle").sort((a,b)=>b.width*b.height-a.width*a.height)){
    const op=f((e.opacity??100)/100),z=e.opacity!=null&&e.opacity<=30;
    s+=`<rect x="${f(e.x+ox)}" y="${f(e.y+oy)}" width="${e.width}" height="${e.height}" rx="${e.roundness?10:0}" ${z?"":`filter="url(#shadow)"`} fill="${e.backgroundColor??"none"}" fill-opacity="${op}" stroke="${e.strokeColor??"#aaa"}" stroke-width="${z?1.5:2}"/>\n`;
  }
  for(const e of E.filter(e=>e.type==="ellipse")){
    const cx=f(e.x+ox+e.width/2),cy=f(e.y+oy+e.height/2),op=f((e.opacity??100)/100);
    s+=`<ellipse cx="${cx}" cy="${cy}" rx="${e.width/2}" ry="${e.height/2}" fill="${e.backgroundColor??"none"}" fill-opacity="${op}" stroke="${e.strokeColor??"#aaa"}" stroke-width="2"/>\n`;
  }
  for(const e of E.filter(e=>e.type==="diamond")){
    const cx=f(e.x+ox+e.width/2),cy=f(e.y+oy+e.height/2),op=f((e.opacity??100)/100);
    s+=`<polygon points="${f(cx)},${f(e.y+oy)} ${f(e.x+ox+e.width)},${cy} ${f(cx)},${f(e.y+oy+e.height)} ${f(e.x+ox)},${cy}" fill="${e.backgroundColor??"none"}" fill-opacity="${op}" stroke="${e.strokeColor??"#aaa"}" stroke-width="2"/>\n`;
  }
  for(const e of E.filter(e=>e.type==="line")){
    if(!e.points||e.points.length<2)continue;
    s+=`<polyline points="${e.points.map(([px,py])=>`${f(e.x+ox+px)},${f(e.y+oy+py)}`).join(" ")}" fill="none" stroke="${e.strokeColor??"#aaa"}" stroke-width="${e.strokeWidth??1}" stroke-dasharray="${e.strokeStyle==="dashed"?"6,3":""}"/>\n`;
  }
  for(const e of E.filter(e=>e.type==="text")){
    const ls=e.text.split("\n"),fs=e.fontSize??14,lh=f(fs*1.4),cx=f(e.x+ox+(e.width??0)/2),sy=f(e.y+oy+fs*0.9);
    s+=`<text text-anchor="middle" fill="${e.strokeColor??"#333"}" font-size="${fs}" font-weight="${fs>=18?"700":fs>=14?"600":"400"}" font-family="inherit">\n`;
    ls.forEach((l,i)=>s+=i===0?`  <tspan x="${cx}" y="${sy}">${esc(l.trim()||" ")}</tspan>\n`:`  <tspan x="${cx}" dy="${lh}">${esc(l.trim()||" ")}</tspan>\n`);
    s+=`</text>\n`;
  }
  for(const e of E.filter(e=>e.type==="arrow")){
    if(!e.points||e.points.length<2)continue;
    s+=`<polyline points="${e.points.map(([px,py])=>`${f(e.x+ox+px)},${f(e.y+oy+py)}`).join(" ")}" fill="none" stroke="${e.strokeColor??"#555"}" stroke-width="${e.strokeWidth??2}" marker-end="url(#ah)"/>\n`;
  }
  return s+`</svg>`;
}
for(const[i,o]of D){
  if(!existsSync(i)){console.log(`Skip: ${i}`);continue;}
  writeFileSync(o,toSvg(i),"utf-8");
  console.log(`✓ ${o}`);
}
```

```bash
bun docs/diagrams/_gen-svg.mjs || node docs/diagrams/_gen-svg.mjs
rm docs/diagrams/_gen-svg.mjs
```

---

## Step 6: Update README.md

Find or create an `## Architecture` section:

```markdown
## Architecture

### Folder Structure
![Folder Structure](docs/diagrams/structure.svg)

### Data Flow
![Data Flow](docs/diagrams/dataflow.svg)

### System Architecture
![System Architecture](docs/diagrams/architecture.svg)
```

Only update image lines for diagrams regenerated this run.

---

## Step 7: Summary

Report: which diagrams generated/skipped, file paths, one-line description per diagram, visual pattern used, any unclear or assumed parts.
