---
name: ci-setup
description: Bootstrap the full quality pipeline from scratch — GitHub Actions CI workflow, Lefthook pre-commit/pre-push hooks, structure-check script, branch protection, and CodeRabbit. Idempotent — safe to run on an already-configured project.
---

# CI Setup

Bootstrap the full quality pipeline: GitHub Actions, Lefthook, branch protection, and CodeRabbit.
Idempotent — skips anything already in place, only writes what is missing.

---

## Step 1: Check prerequisites

```bash
# gh auth
gh auth status 2>&1

# bun
bun --version 2>&1

# git remote (needed for branch protection)
git remote get-url origin 2>&1
```

If `gh auth status` fails, stop and tell the user:

```
gh is not authenticated. Run:
  gh auth login
Then re-run /ci-setup.
```

If there is no git remote, warn but continue — branch protection will be skipped.

---

## Step 2: Audit current state

Check each component and record present/missing:

```bash
# Workflow
[ -f ".github/workflows/ci.yml" ] && echo "ci.yml: EXISTS" || echo "ci.yml: MISSING"

# Lefthook in package.json devDependencies
grep -q '"lefthook"' package.json && echo "lefthook dep: EXISTS" || echo "lefthook dep: MISSING"

# lefthook.yml
[ -f "lefthook.yml" ] && echo "lefthook.yml: EXISTS" || echo "lefthook.yml: MISSING"

# structure-check.sh
[ -f ".lefthook/structure-check.sh" ] && echo "structure-check.sh: EXISTS" || echo "structure-check.sh: MISSING"

# Lefthook git hooks installed
[ -f ".git/hooks/pre-commit" ] && echo "git hooks: INSTALLED" || echo "git hooks: NOT INSTALLED"

# Prisma (determines whether to include generate step)
[ -f "prisma/schema.prisma" ] && echo "prisma: EXISTS" || echo "prisma: MISSING"

# Branch protection
gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null
gh api repos/{owner}/{repo}/branches/main/protection --jq '.required_status_checks.contexts' 2>/dev/null \
  && echo "branch protection: EXISTS" || echo "branch protection: MISSING"
```

---

## Step 3: Show the setup plan

Print a checklist of what will be done vs. already done:

```
CI setup plan:

  ✔  gh authenticated
  ✔  bun available

  [ ] Create .github/workflows/ci.yml
  ✔  lefthook already in devDependencies
  [ ] Create lefthook.yml
  [ ] Create .lefthook/structure-check.sh
  [ ] Run bunx lefthook install
  [ ] Set branch protection on main

  ⓘ  CodeRabbit — manual step (instructions at end)

Proceed? (y)es / (n)o
```

Wait for confirmation before writing anything.

---

## Step 4: Create `.github/workflows/ci.yml`

Skip if already exists.

Create the directory if needed:

```bash
mkdir -p .github/workflows
```

Write the workflow. Include the Prisma generate step only if `prisma/schema.prisma` was found in Step 2:

**With Prisma:**

```yaml
name: CI

on:
  pull_request:
    branches:
      - main

jobs:
  ci:
    name: Typecheck · Lint · Format
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Generate Prisma client
        run: bun --bun run prisma generate
        env:
          DATABASE_URL: postgresql://localhost/ci

      - name: Typecheck
        run: bunx tsc --noEmit

      - name: Lint
        run: bun lint

      - name: Format check
        run: bun format:check
```

**Without Prisma:**

```yaml
name: CI

on:
  pull_request:
    branches:
      - main

jobs:
  ci:
    name: Typecheck · Lint · Format
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Typecheck
        run: bunx tsc --noEmit

      - name: Lint
        run: bun lint

      - name: Format check
        run: bun format:check
```

Print: `Created .github/workflows/ci.yml`

---

## Step 5: Install Lefthook

Skip if `lefthook` already appears in `package.json` devDependencies.

```bash
bun add -D lefthook
```

Print: `Installed lefthook`

---

## Step 6: Create `lefthook.yml`

Skip if already exists.

```yaml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: "src/**/*.{ts,tsx}"
      run: bun lint {staged_files}
    format:
      glob: "src/**/*.{ts,tsx,css,json,md}"
      run: bun format:check {staged_files}
    structure:
      run: .lefthook/structure-check.sh

pre-push:
  commands:
    typecheck:
      run: bunx tsc --noEmit
```

Print: `Created lefthook.yml`

---

## Step 7: Create `.lefthook/structure-check.sh`

Skip if already exists.

```bash
mkdir -p .lefthook
```

Write the script:

```bash
#!/bin/bash
# Checks staged files against folder conventions.
# Hard blocks: src/generated/ staged manually.
# Soft warnings: everything else — prints violations, exits 0.

WARNINGS=()
ERRORS=()

NEXT_RESERVED="^(page|layout|error|loading|not-found|template|default|route)$"

check_file() {
  local file="$1"
  [[ "$file" != src/* ]] && return

  if [[ "$file" =~ ^src/generated/ ]]; then
    ERRORS+=("$file — generated files must never be manually staged")
    return
  fi

  if [[ "$file" =~ ^src/app/.*\.(tsx|ts)$ ]]; then
    local stem
    stem=$(basename "$file" | sed 's/\..*//')
    if [[ ! "$stem" =~ $NEXT_RESERVED ]]; then
      WARNINGS+=("$file — only page/layout/error/loading/route etc. belong in src/app/")
    fi
  fi

  if [[ "$file" =~ /use[A-Z][a-zA-Z]*\.(ts|tsx)$ ]]; then
    if [[ ! "$file" =~ ^src/(hooks/|features/[^/]+/hooks/) ]]; then
      WARNINGS+=("$file — hook files must be in src/hooks/ or src/features/[feature]/hooks/")
    fi
  fi

  if [[ "$file" =~ ^src/components/ui/ ]]; then
    WARNINGS+=("$file — src/components/ui/ is for shadcn primitives only")
  fi
}

while IFS= read -r file; do
  check_file "$file"
done < <(git diff --cached --name-only)

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo "🚫 Commit blocked — fix these before committing:"
  for err in "${ERRORS[@]}"; do echo "   ✖ $err"; done
  echo ""
  exit 1
fi

if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo ""
  echo "⚠️  Folder convention warnings (${#WARNINGS[@]} found):"
  for warn in "${WARNINGS[@]}"; do echo "   → $warn"; done
  echo ""
  echo "   These won't block your commit. Fix them to keep the project structure clean."
  echo ""
fi

exit 0
```

Make it executable:

```bash
chmod +x .lefthook/structure-check.sh
```

Print: `Created .lefthook/structure-check.sh`

---

## Step 8: Install Lefthook git hooks

Always run this — it is idempotent:

```bash
bunx lefthook install
```

Print: `Lefthook hooks installed`

---

## Step 9: Set branch protection on `main`

Skip if branch protection already exists (from Step 2 audit).
Skip if no git remote was found.

Derive the repo:

```bash
gh repo view --json nameWithOwner --jq '.nameWithOwner'
```

Apply protection:

```bash
echo '{"required_status_checks":{"strict":true,"contexts":["Typecheck · Lint · Format"]},"enforce_admins":false,"required_pull_request_reviews":null,"restrictions":null}' \
  | gh api -X PUT repos/{owner}/{repo}/branches/main/protection --input -
```

Print: `Branch protection set — main now requires CI to pass before merge`

---

## Step 10: CodeRabbit (manual)

CodeRabbit is a GitHub App and cannot be installed from the terminal. Print:

```
CodeRabbit — install manually:

  1. Go to: https://github.com/apps/coderabbitai
  2. Click "Install" and select this repository
  3. CodeRabbit will post an AI review on every PR automatically

  No config file needed — it works out of the box.
```

---

## Step 11: Summary

Print a final checklist of everything that was done:

```
CI setup complete:

  ✔  .github/workflows/ci.yml — created
  ✔  lefthook — installed
  ✔  lefthook.yml — created
  ✔  .lefthook/structure-check.sh — created
  ✔  Lefthook git hooks — installed
  ✔  Branch protection — set on main

  ⓘ  CodeRabbit — install manually at github.com/apps/coderabbitai

Your pipeline is live. Push a PR to main to trigger the first CI run.
```

Items that were already present show as `(already configured)` instead of `created`.

---

## Single-Letter Commands

| Prompt    | Full word | Shorthand |
|-----------|-----------|-----------|
| Proceed?  | `yes`     | `y`       |
| Cancel    | `no`      | `n`       |
