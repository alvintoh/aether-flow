---
name: review-design
description: Review all components in src/components/ and src/features/ against UI/UX best practices — spacing, visual hierarchy, typography, colour, component states, motion, accessibility, and responsive design. Returns a prioritised findings list.
---

You are running a structured UI/UX design review of this Next.js + Tailwind CSS project.

Adapt all file paths to the project's actual structure as defined in CLAUDE.md. If unsure of the correct component paths, check CLAUDE.md before assuming.

## Step 1 — Discover and read component and style files

Use Glob to discover files:

- `src/components/**/*.tsx` — shared UI components
- `src/features/**/*.tsx` — feature-specific components
- `src/app/globals.css` — theme tokens and global styles

Read `src/app/globals.css` first to understand the token system before reviewing components.
Read only the components most relevant to the current review scope — do not read every file speculatively.

---

## Step 2 — Review against these criteria

**Spacing & Layout**

- Use an 8pt grid — all spacing should be multiples of 4 or 8 (Tailwind: `2`, `4`, `6`, `8`, `12`, `16`, `24`, `32`)
- Content panels need generous internal padding (`p-4` minimum, `p-6` for content areas)
- Prefer `gap` over `margin` for spacing between siblings in flex/grid
- Whitespace is content — empty space directs attention and reduces cognitive load

**Visual Hierarchy**

- One primary focal point per view — don't split the user's attention
- Hierarchy: size → weight → colour → position
- Accent colour should be used sparingly — overuse kills its meaning
- Labels on interactive elements must be self-explanatory without surrounding context

**Typography**

- Minimum body font size: 16px
- Line length: 60–75 characters for prose (`max-w-xl` to `max-w-2xl`)
- Line height: `leading-relaxed` for body copy, `leading-tight` for headings
- One `<h1>` per page, `<h2>` per section — never skip levels
- Avoid pure white text on dark backgrounds — use off-white to reduce eye strain
- Limit font weights to 2–3 per design

**Colour**

- WCAG AA contrast: 4.5:1 for normal text, 3:1 for large text and UI components
- Never communicate information through colour alone — pair with icons or labels
- Use semantic colour roles defined in `globals.css` — never hardcode hex values in components
- Status colours must be visually distinct: running (blue/amber), success (green), error (red), idle (neutral)
- Keep the palette small: 2 neutrals + 1 accent + status colours

**Component Design**

- Cards: consistent border-radius, padding, and shadow across all instances
- Buttons: clear visual priority between primary (filled), secondary (outline), ghost (text)
- Links: always distinguishable from plain text — underline, colour, or both; never colour alone
- Icons: consistent size within context; paired with a label unless meaning is universally obvious
- Form inputs: consistent height, border, focus ring, and error state across all instances
- Use `cva` (class-variance-authority) for component variants — avoid scattered one-off class combinations

**State Design — every data surface needs three states**

- **Loading** — skeleton matching the content shape (not a generic grey box); use `animate-pulse`
- **Empty** — explain why it's empty, provide a call to action, include an icon; never a blank space
- **Error** — human-readable message with a recovery action (retry, go back)

Use a spinner only for user-triggered actions (form submit, delete); use skeletons for page-load content.

**Interactive States — every interactive element needs all five states**

- **Default** — resting
- **Hover** — subtle change confirming interactivity (`transition-colors duration-150`)
- **Focus** — visible ring for keyboard users (`focus-visible:ring-2`); never remove without replacing
- **Active** — brief feedback on click (`scale-95` or colour darken)
- **Disabled** — reduced opacity, `cursor-not-allowed`, no hover effect

**Status Indicators**

- Status badges (draft, active, paused, error) must use consistent colour + icon pairs across all views
- Running state must feel alive — a subtle animation (pulsing dot, spinner) communicates progress
- Error state must be unmissable without being alarming — red with an icon, never colour-only
- Timestamps and durations should use a consistent format (relative for recent, absolute for older)

**Motion & Animation**

- Animation must have purpose: entrance, transition, feedback, or emphasis — not decoration
- Entrance: 150–300ms `ease-out`; exit: 100–200ms `ease-in`
- Avoid animating more than 2–3 elements simultaneously
- Always support `prefers-reduced-motion` — use Framer Motion's `useReducedMotion` or CSS media query
- Prefer CSS transitions for simple state changes; use Framer Motion for complex sequences

**Responsive Design**

- Mobile-first — base styles for mobile, layer up with `md:` and `lg:`
- Test at 375px, 390px, 768px, 1280px, 1920px
- Canvas/editor views that require a minimum viewport should show a clear message on smaller screens, not a broken layout
- Sidebar panels must collapse or stack gracefully at smaller viewports
- Text must never overflow — use `truncate`, `line-clamp`, or `break-words`
- Use `h-dvh` not `h-screen` — accounts for mobile browser chrome

**Accessibility**

- Use semantic HTML (`<button>`, `<nav>`, `<main>`, `<section>`) — never `<div>` for interactive elements
- Visible focus styles on all interactive elements (`focus-visible:ring-2`)
- Minimum 44×44px touch targets on mobile
- Icon-only buttons must have `aria-label`
- Use `aria-live` for dynamic content updates (status changes, toast notifications, loading states)
- Layout must not break at 200% browser zoom
- Colour contrast: 4.5:1 for normal text, 3:1 for large text (WCAG AA)

**Images & Media**

- Explicit `width` and `height` on all images to prevent CLS
- `alt` text describes content meaningfully; use `alt=""` only for decorative images
- Use `next/image` with `priority` only for above-the-fold images

---

## Step 3 — Return findings

Return a **numbered list of improvements, most impactful first**. For each finding:

- Short explanation of the issue
- Which file and approximate line it appears in
- Tailwind snippet only if it makes the fix significantly clearer
