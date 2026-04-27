---
name: commit-pr
description: Use when work is ready for review. Stages all changes, commits (single or split), auto-creates a feature branch if on main, pushes, and opens a PR to main. CI runs typecheck/lint/format automatically on the PR.
---

# Commit PR

Stage all changes, analyse them, commit (single or split), auto-create a
feature branch if needed, push, and open a pull request to `main`.
CI will run automatically — the PR cannot be merged until it passes.

---

## Step 1: Check for changes

```bash
git status
git branch --show-current
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

## Step 2b: Check folder conventions

Scan the staged files against the folder conventions in `CLAUDE.md` before deciding on commit structure.

```bash
git diff --cached --name-only
```

Check each staged `src/` file against these rules:

| Rule | Violation example |
|---|---|
| `src/app/` files must be Next.js reserved names only (`page`, `layout`, `error`, `loading`, `not-found`, `template`, `default`, `route`) | `src/app/(dashboard)/WorkflowCard.tsx` |
| Custom hooks (`useX.ts/tsx`) must be in `src/hooks/` or `src/features/*/hooks/` | `src/lib/useWorkflow.ts` |
| `src/components/ui/` is shadcn only — never hand-create files here | `src/components/ui/CustomCard.tsx` |
| `src/generated/` files must never be manually staged | `src/generated/prisma/anything` |
| Shared utilities belong in `src/lib/` — not loose in `src/` root | `src/formatDate.ts` |
| tRPC routers belong in `src/trpc/routers/` | `src/lib/workflowRouter.ts` |
| Inngest functions belong in `src/inngest/` | `src/lib/myJob.ts` |
| Feature-specific code belongs in `src/features/[feature]/` not in `src/components/` | `src/components/WorkflowCard.tsx` |

If violations are found, surface them before proceeding:

```
⚠️  Folder convention warnings:
  src/app/(dashboard)/WorkflowCard.tsx — move to src/features/workflows/components/
  src/lib/useWorkflow.ts — hook files must be in src/hooks/ or src/features/*/hooks/

Fix before committing? (f)ix / (i)gnore and continue
```

- **(f)ix** — stop here, let the user move the files, do not proceed
- **(i)gnore** — continue to Step 3 with the violations noted

If no violations, continue silently.

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
git restore --staged .
git add <file1> <file2> <dir/>
# commit group 1, then repeat
```

---

## Step 4: Present the plan (including branch name)

At this point you know the commit message(s). Derive the branch name **before**
presenting the plan so the user sees everything at once.

### Branch name derivation

Use the **primary commit** (highest priority: `feat` > `fix` > `refactor` > `chore` > `docs`):

1. Take the type and scope: `feat(workflows)` → prefix `feat/workflows`
2. Append a short slug from the subject (first 2–3 meaningful words, hyphens):
   `scaffold workflows feature` → `scaffold-workflows`
3. Combine: `feat/workflows-scaffold-workflows`
4. Truncate to 50 chars max, lowercase, no special chars except hyphens

Examples:
- `feat(auth): add JWT refresh token` → `feat/auth-add-jwt-refresh`
- `fix(db): handle null user on login` → `fix/db-handle-null-user`
- `chore(tooling): replace Biome with oxlint` → `chore/tooling-replace-biome`

If the **current branch is already not `main`**, skip branch creation — use the current branch as-is.

### If single commit and on main

```
Staged changes: <brief summary>

Suggested commit message:
  feat(auth): add JWT refresh token support

Suggested branch: feat/auth-add-jwt-refresh
Use this branch name? (y)es / (e)dit / (x)cancel
```

### If single commit and already on a feature branch

```
Staged changes: <brief summary>

Suggested commit message:
  feat(auth): add JWT refresh token support

Branch: <current-branch> (current)

Proceed? (c)ommit / (e)dit / (x)cancel
```

### If splitting and on main

Show the full plan including the branch name upfront:

```
Changes span N concerns — suggesting split into N commits:

  Commit 1 of N · chore(tooling): replace Biome with oxlint + oxfmt
  Files: package.json, bun.lock

  Commit 2 of N · feat(workflows): scaffold workflows feature
  Files: src/features/workflows/**, prisma/schema.prisma

Suggested branch: feat/workflows-scaffold-workflows
  (derived from the primary commit)

Proceed with this plan? (y)es / (e)dit / (n)o — commit everything together
```

Wait for confirmation before touching any git commands.

---

## Step 5: Create branch (if on main)

If the current branch is `main` and the user confirmed or provided a branch name:

```bash
git checkout -b <branch-name>
```

Print: `Created branch: <branch-name>`

Then proceed to Step 6.

---

## Step 6: Execute commits

### Single commit path

```bash
git commit -m "<message>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Split commit path

For each group in order:
1. `git restore --staged .`
2. `git add <files for this group>`
3. `git diff --cached --stat` — confirm what's staged
4. `git commit -m "<message>\n\nCo-Authored-By: ..."`
5. Print: `Committed N of M: <message>`
6. Move to next group

After the final commit, print a summary:

```
All N commits created:
  ae1f3b2 · chore(tooling): replace Biome with oxlint + oxfmt
  c9d2a41 · feat(workflows): scaffold workflows feature
```

---

## Step 7: Push and open PR

Ask once:

```
Push and open PR? (p)ush / (s)kip
```

If confirmed:

```bash
git push -u origin <branch-name>
```

Then open a PR to `main`:

```bash
gh pr create --base main --title "<title>" --body "$(cat <<'EOF'
## Summary
- <bullet 1>
- <bullet 2>

## Test plan
- [ ] <manual check 1>
- [ ] <manual check 2>

> CI (typecheck · lint · format) will run automatically and must pass before merge.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**PR title** = the commit message if single commit, or a one-line summary of all commits if split.

After the PR is created, print the PR URL.

---

## Step 8: Ensure branch protection on `main`

After the PR is created, silently check whether branch protection is already configured:

```bash
gh api repos/{owner}/{repo}/branches/main/protection --jq '.required_status_checks.contexts' 2>/dev/null
```

Derive `{owner}` and `{repo}` from the remote URL:

```bash
gh repo view --json nameWithOwner --jq '.nameWithOwner'
```

**If the check `"Typecheck · Lint · Format"` is already present** — do nothing, print nothing.

**If branch protection is missing or the check is not listed** — apply it silently then print one line:

```bash
echo '{"required_status_checks":{"strict":true,"contexts":["Typecheck · Lint · Format"]},"enforce_admins":false,"required_pull_request_reviews":null,"restrictions":null}' \
  | gh api -X PUT repos/{owner}/{repo}/branches/main/protection --input -
```

Print:
```
Branch protection set: main now requires CI to pass before merge.
```

This step is idempotent — running it multiple times is safe.

---

## Single-Letter Commands

| Prompt | Full word | Shorthand |
|--------|-----------|-----------|
| Proceed? / Branch OK? | `yes` / `commit` | `y` / `c` |
| Edit branch name or message | `edit` | `e` |
| Cancel | `no` / `cancel` | `n` / `x` |
| Push and open PR? | `push` | `p` |
| Push and open PR? | `skip` | `s` |

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
- Never push directly to `main` — always push to the feature branch
- Always derive and show the branch name as part of the plan in Step 4
- Always confirm the full plan (commits + branch) before executing anything
- Never amend a previous commit — always create new ones
- Ask to push and open PR once at the end, not after each individual commit
