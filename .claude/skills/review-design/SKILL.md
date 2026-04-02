---
name: review-design
description: Review all components in src/components/ against UI/UX best practices — spacing, visual hierarchy, typography, colour, responsive design, motion, and accessibility. Returns a prioritised findings list.
---

You are running a structured UI/UX design review of this Next.js + Tailwind CSS portfolio.

## Step 1 — Discover and read all component and style files

Use Glob to discover files:
- Pattern `src/components/**/*.tsx` — all components
- Pattern `src/app/page.tsx` and `src/app/layout.tsx` — app entry points
- Pattern `src/app/globals.css` — theme tokens and global styles

Read every file returned by these globs.

## Step 2 — Review against these criteria

**Spacing & Layout**
- Use an 8pt grid — all spacing should be multiples of 4 or 8 (Tailwind: `2`, `4`, `6`, `8`, `12`, `16`, `24`, `32`)
- Sections need generous vertical breathing room (`py-20` to `py-32`)
- Prefer `gap` over `margin` for spacing between siblings in flex/grid
- Whitespace is content — empty space directs attention and reduces cognitive load

**Visual Hierarchy**
- One primary focal point per section — don't split the user's attention
- Hierarchy: size → weight → colour → position
- Accent colour (`#64ffda`) should be used sparingly — overuse kills its meaning
- Headings should form a scannable outline

**Typography**
- Minimum body font size: 16px
- Line length: 60–75 characters for prose (`max-w-xl` to `max-w-2xl`)
- Line height: `leading-relaxed` for body copy, `leading-tight` for headings
- One `<h1>` per page, `<h2>` per section, `<h3>` for subsections — never skip levels
- Avoid pure white text on dark backgrounds — use off-white to reduce eye strain

**Colour**
- WCAG AA contrast: 4.5:1 for normal text, 3:1 for large text and UI components
- Never communicate information through colour alone — pair with icons or labels
- Palette: background `#0a192f`, foreground `#8892b0`, accent `#64ffda` — flag any deviations

**Component Design**
- Cards: consistent border-radius, padding, and shadow across all instances
- Buttons/links: always distinguishable from plain text
- Icons: consistent size within context; paired with a label unless universally obvious

**Interactive States**
Every interactive element needs:
- **Hover** — subtle change confirming interactivity (`transition-colors duration-150`)
- **Focus** — visible ring for keyboard users (`focus-visible:ring-2`)
- **Active** — brief feedback on click
- **Disabled** — reduced opacity, `cursor-not-allowed`

**Motion & Animation**
- Animation must have purpose — not decoration
- Entrance: 150–300ms `ease-out`; exit: 100–200ms `ease-in`
- Always support `prefers-reduced-motion`
- `MouseGlow.tsx` — verify it only runs on desktop and respects reduced motion

**Responsive Design**
- Mobile-first — base styles for mobile, layer up with `md:` and `lg:`
- Test breakpoints: 375px, 390px, 768px, 1280px, 1920px
- Sidebar layout (`lg:` fixed left panel) must stack vertically on mobile
- Text must never overflow — flag missing `truncate`, `line-clamp`, or `break-words`
- Use `h-dvh` not `h-screen` — accounts for mobile browser chrome

**Navigation**
- Active section highlight must be visible (`Navigation.tsx` uses IntersectionObserver — verify it works)
- Anchor links must account for sticky header height via `scroll-margin-top`

**Images & Media**
- Explicit `width` and `height` on all `next/image` usage to prevent CLS
- `alt` text describes content meaningfully

**Accessibility**
- Semantic HTML throughout — never `<div>` for interactive elements
- Visible focus styles on all interactive elements
- Minimum 44×44px touch targets on mobile
- Layout must not break at 200% browser zoom

## Step 3 — Return findings

Return a **numbered list of improvements, most impactful first**. For each finding:
- Short explanation of the issue
- Which file and approximate line it appears in
- Tailwind snippet only if it makes the fix significantly clearer
