---
name: commit-review
description: Use when you want Claude to stage all changes, review them, and suggest a commit message before you decide whether to commit and push. Automatically splits large multi-concern changes into separate focused commits.
---

# Commit Review

Stage all changes, analyse them, and either propose a single commit message or
split into multiple focused commits — one per logical concern.

---

## Step 1: Check for changes

```bash
git status
```

If the working tree is clean, say so and stop.

**⚠️ Never commit `.env` files or files likely containing secrets.** If found,
warn the user and exclude them from staging before proceeding.

---

## Step 2: Stage everything

```bash
git add -A
git diff --cached --stat
```

Use the stat output to understand the full scope of changes before deciding
whether to split.

---

## Step 3: Decide — single commit or split?

A commit should represent **one logical change**. Analyse the staged diff and
group files by concern:

### Concern categories (use these to identify groups)

| Category | Typical files |
|----------|--------------|
| `feat` | New feature code in `src/` |
| `fix` | Bug fix in `src/` |
| `refactor` | Restructured code, no behavior change |
| `style` | Formatter-only changes (whitespace, trailing commas, import order) |
| `chore(tooling)` | `package.json`, `bun.lock`, config files, linter/formatter setup |
| `chore(claude)` | `.claude/agents/`, `.claude/skills/` |
| `docs` | `README.md`, `CLAUDE.md`, `docs/`, comments |
| `test` | Test files |
| `perf` | Performance-focused changes |

### Split rules

**Split into separate commits when** changes belong to 2 or more categories
AND the groups are independently coherent (each makes sense on its own).

**Keep as one commit when:**
- Changes are small (≤ 10 files) even if they touch 2 categories
- The categories are tightly coupled (e.g. a `feat` that necessarily updates
  `docs` or `package.json` as part of the same feature)
- Splitting would leave either commit in a broken or meaningless state

### How to split

Use `git restore --staged` to unstage files, then commit one group at a time:

```bash
# Unstage everything first
git restore --staged .

# Stage only the first group
git add <file1> <file2> <dir/>

# Commit group 1, then repeat for each subsequent group
```

---

## Step 4: Present the plan

### If single commit

```
Staged changes: <brief summary>

Suggested commit message:
  feat(auth): add JWT refresh token support

Proceed? (c)ommit / (e)dit / (x)cancel
```

### If splitting

Show the full plan upfront before doing anything:

```
Changes span N concerns — suggesting split into N commits:

  Commit 1 of N · chore(tooling): replace Biome with oxlint + oxfmt
  Files: package.json, bun.lock, .oxlintrc.json, .oxfmtrc.json, biome.json,
         .vscode/settings.json

  Commit 2 of N · style: reformat all source files with oxfmt
  Files: src/components/ui/* (52 files), src/app/* (8 files)

  Commit 3 of N · chore(claude): add arch-add, arch-replace, docs-assemble skills
  Files: .claude/skills/*, .claude/agents/*

  Commit 4 of N · docs: replace boilerplate README and update CLAUDE.md
  Files: README.md, CLAUDE.md

Proceed with this split? (y)es / (e)dit plan / (n)o — commit everything together
```

Wait for confirmation before touching any git commands.

---

## Step 5: Execute

### Single commit path

```bash
git commit -m "<message>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Split commit path

For each group in order:
1. `git restore --staged .` — clear the staging area
2. `git add <files for this group>`
3. `git diff --cached --stat` — confirm what's staged
4. `git commit -m "<message for this group>\n\nCo-Authored-By: ..."`
5. Print: `Committed N of M: <message>`
6. Move to next group

After the final commit, print a summary:

```
All N commits created:
  ae1f3b2 · chore(tooling): replace Biome with oxlint + oxfmt
  c9d2a41 · style: reformat all source files with oxfmt
  8f3e1bc · chore(claude): add arch-add, arch-replace, docs-assemble skills
  1a2b3c4 · docs: replace boilerplate README and update CLAUDE.md
```

---

## Step 6: Push

After all commits are done, ask once:

```
Push to remote? (p)ush / (s)kip
```

Run `git push` only if the user confirms. Never push automatically.

---

## Single-Letter Commands

| Prompt | Full word | Shorthand |
|--------|-----------|-----------|
| Proceed? | `commit` | `c` |
| Proceed? | `yes` | `y` |
| Proceed? | `edit` | `e` |
| Proceed? | `no` / `cancel` | `n` / `x` |
| Push? | `push` | `p` |
| Push? | `skip` | `s` |

---

## Conventional Commit Types

| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling, deps, config |
| `refactor` | Code change without behavior change |
| `style` | Formatting, whitespace — no logic change |
| `docs` | Documentation only |
| `test` | Tests |
| `perf` | Performance improvement |

---

## Rules

- Never use `cd` before git commands
- Never commit `.env` or files likely containing secrets — warn and exclude
- Always confirm the split plan with the user before executing it
- Never amend a previous commit — always create new ones
- Ask to push once at the end, not after each individual commit in a split
