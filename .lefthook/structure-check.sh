#!/bin/bash
# Checks staged files against folder conventions defined in CLAUDE.md.
# Mirrors the convention checks in /commit-push and /commit-pr skills.
# Hard blocks: src/generated/ staged manually.
# Soft warnings: everything else — prints violations, exits 0.

WARNINGS=()
ERRORS=()

NEXT_RESERVED="^(page|layout|error|loading|not-found|template|default|route)$"

check_file() {
  local file="$1"

  # Only check src/ files
  [[ "$file" != src/* ]] && return

  # --- Hard block: generated files must never be manually staged ---
  if [[ "$file" =~ ^src/generated/ ]]; then
    ERRORS+=("$file — generated files must never be manually staged (run 'bun --bun run prisma generate' instead)")
    return
  fi

  # --- src/app/ must contain Next.js reserved filenames only ---
  if [[ "$file" =~ ^src/app/.*\.(tsx|ts)$ ]]; then
    local stem
    stem=$(basename "$file" | sed 's/\..*//')
    if [[ ! "$stem" =~ $NEXT_RESERVED ]]; then
      WARNINGS+=("$file — only page/layout/error/loading/route etc. belong in src/app/, move to src/features/[feature]/components/ or src/components/")
    fi
  fi

  # --- Hook files must be in src/hooks/ or src/features/*/hooks/ ---
  if [[ "$file" =~ /use[A-Z][a-zA-Z]*\.(ts|tsx)$ ]]; then
    if [[ ! "$file" =~ ^src/(hooks/|features/[^/]+/hooks/) ]]; then
      WARNINGS+=("$file — hook files must be in src/hooks/ or src/features/[feature]/hooks/")
    fi
  fi

  # --- src/components/ui/ is shadcn only — do not hand-create files ---
  if [[ "$file" =~ ^src/components/ui/ ]]; then
    WARNINGS+=("$file — src/components/ui/ is for shadcn primitives only, hand-creating files here is not allowed")
  fi

  # --- Loose files in src/ root (only middleware.ts and instrumentation.ts are allowed) ---
  if [[ "$file" =~ ^src/[^/]+\.(ts|tsx)$ ]]; then
    local stem
    stem=$(basename "$file" | sed 's/\..*//')
    if [[ ! "$stem" =~ ^(middleware|instrumentation)$ ]]; then
      WARNINGS+=("$file — files in src/ root should live in a subdirectory (src/lib/, src/hooks/, etc.)")
    fi
  fi

  # --- tRPC routers must be in src/trpc/routers/ ---
  if [[ "$file" =~ Router\.(ts|tsx)$ ]] || [[ "$file" =~ \.router\.(ts|tsx)$ ]]; then
    if [[ ! "$file" =~ ^src/trpc/routers/ ]]; then
      WARNINGS+=("$file — tRPC routers belong in src/trpc/routers/")
    fi
  fi

  # --- Inngest functions must be in src/inngest/ ---
  if [[ "$file" =~ \.inngest\.(ts|tsx)$ ]]; then
    if [[ ! "$file" =~ ^src/inngest/ ]]; then
      WARNINGS+=("$file — Inngest functions belong in src/inngest/")
    fi
  fi
}

while IFS= read -r file; do
  check_file "$file"
done < <(git diff --cached --name-only)

# --- Hard errors: block the commit ---
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo "🚫 Commit blocked — fix these before committing:"
  for err in "${ERRORS[@]}"; do
    echo "   ✖ $err"
  done
  echo ""
  exit 1
fi

# --- Soft warnings: let the commit through but flag clearly ---
if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo ""
  echo "⚠️  Folder convention warnings (${#WARNINGS[@]} found):"
  for warn in "${WARNINGS[@]}"; do
    echo "   → $warn"
  done
  echo ""
  echo "   These won't block your commit. Fix them to keep the project structure clean."
  echo "   To skip this check: git commit --no-verify"
  echo ""
fi

exit 0
