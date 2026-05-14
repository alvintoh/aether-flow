---
name: dx-codespace
description: >
  Audit and fix the Codespaces dev environment for this project.
  Checks devcontainer.json, Dockerfile, package.json dev script, mprocs.yaml,
  and Codespaces secrets. Surfaces blockers (502s, auth failures, slow startup)
  and applies fixes with confirmation.
argument-hint: "[fix|audit]"
---

# Codespaces DX Auditor

Audit the Codespaces setup for this project and fix any issues found.

## Arguments

- `/dx-codespace` or `/dx-codespace audit` — read and report issues only, no changes
- `/dx-codespace fix` — audit then apply all fixes with confirmation per change

---

## Step 1 — Read the config files

Read all four files in parallel:

```
.devcontainer/devcontainer.json
.devcontainer/Dockerfile
package.json               (dev script only)
mprocs.yaml
```

---

## Step 2 — Run the checklist

Check each item. Mark **PASS**, **FAIL**, or **WARN**.

### A. Dockerfile — Bun pre-installed

- **PASS**: `Dockerfile` exists and contains `bun.sh/install`
- **FAIL**: No `Dockerfile` (uses `image:` only) — Bun is curl-installed on every Codespace create (~30s penalty)
- **WARN**: Dockerfile exists but doesn't set `BUN_INSTALL` / `PATH` env vars

Fix:
```dockerfile
FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

USER vscode
RUN curl -fsSL https://bun.sh/install | bash

ENV BUN_INSTALL="/home/vscode/.bun"
ENV PATH="${BUN_INSTALL}/bin:${PATH}"
```

---

### B. devcontainer.json — uses `build.dockerfile`

- **PASS**: `"build": { "dockerfile": "Dockerfile" }` present
- **FAIL**: Uses `"image":` directly — Dockerfile is ignored

Fix: replace `"image": "..."` with:
```json
"build": { "dockerfile": "Dockerfile" }
```

---

### C. postCreateCommand — installs deps and generates Prisma

- **PASS**: `"postCreateCommand": "bun install && bun --bun run prisma generate"`
- **WARN**: Missing `bun --bun run prisma generate` — Prisma types won't exist, TypeScript will fail
- **WARN**: Uses `npm install` or `yarn` — wrong package manager

---

### D. BETTER_AUTH_URL — dynamic via remoteEnv

- **PASS**: `remoteEnv` contains `BETTER_AUTH_URL` using `${localEnv:CODESPACE_NAME}` and `${localEnv:GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
- **FAIL**: Not set — auth will redirect to `localhost:3000`, causing 502 on every page load in Codespaces
- **FAIL**: Set in `containerEnv` instead of `remoteEnv` — `containerEnv` does NOT expand `localEnv:` variables

Fix:
```json
"remoteEnv": {
  "BETTER_AUTH_URL": "https://${localEnv:CODESPACE_NAME}-3000.${localEnv:GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
}
```

---

### E. package.json dev script — binds to 0.0.0.0

- **PASS**: `"dev": "next dev --hostname 0.0.0.0"`
- **FAIL**: Missing `--hostname 0.0.0.0` — Next.js binds to `127.0.0.1` only; port forwarding returns 502

Fix: add `--hostname 0.0.0.0` to the `dev` script in `package.json`.

---

### F. mprocs.yaml — correct next proc command

- **PASS**: `next` proc uses `["bun", "run", "dev"]`
- **FAIL**: Uses `["bun", "run", "next", ...]` — `bun run next` is not a valid script name
- **FAIL**: Uses `["bun", "next", "dev"]` — bypasses `package.json` scripts, ignores `--hostname` flag

---

### G. Port forwarding

- **PASS**: `forwardPorts` includes `3000` and `8288`; port 3000 has `"onAutoForward": "openBrowser"`
- **WARN**: Port 3000 missing `openBrowser` — browser won't auto-open on Codespace start
- **WARN**: Port 8288 (Inngest) not forwarded — Inngest dev server won't receive webhooks

---

### H. INNGEST_DEV flag

- **PASS**: `containerEnv` contains `"INNGEST_DEV": "1"`
- **WARN**: Missing — Inngest will try to connect to Inngest Cloud instead of local dev server

---

### I. BETTER_AUTH_URL secret conflict

Codespaces secrets override `remoteEnv` silently. If `BETTER_AUTH_URL` was ever synced via `gh secret set --app codespaces -f .env`, it wins with the wrong value (`localhost:3000`) regardless of what `remoteEnv` says.

Check:
```bash
gh secret list --app codespaces | grep BETTER_AUTH_URL
```

- **PASS**: `BETTER_AUTH_URL` does NOT appear in the secrets list
- **FAIL**: `BETTER_AUTH_URL` appears — it overrides `remoteEnv` with a hardcoded wrong value

Fix:
```bash
gh secret delete --app codespaces BETTER_AUTH_URL
```

---

### J. Prebuilds — feature branch coverage

- **PASS**: Prebuild branch pattern covers feature branches (`refs/heads/feat/**` or "Any branch")
- **WARN**: Prebuild only targets `main` — feature branch Codespaces fall back to cold build (~3 min)
- **INFO**: No prebuild configured — all Codespaces take ~3 min to start

To fix: repo Settings → Codespaces → edit prebuild → Branch → "Any branch" or `refs/heads/feat/**`. Requires a manual GitHub settings change — cannot be done from code.

---

## Step 3 — Report findings

Format:

```
Codespaces audit — 3 issues found

  A. Dockerfile ................. PASS
  B. build.dockerfile ........... PASS
  C. postCreateCommand .......... PASS
  D. BETTER_AUTH_URL remoteEnv .. FAIL  — auth redirects to localhost:3000, causes 502
  E. --hostname 0.0.0.0 ......... FAIL  — Next.js unreachable via port forwarding
  F. mprocs next command ........ PASS
  G. Port forwarding ............ WARN  — port 8288 not forwarded
  H. INNGEST_DEV ................ PASS
  I. Secret conflict ............. PASS
  J. Prebuild coverage ........... WARN  — feature branches not covered
```

If audit-only mode: stop here.

---

## Step 4 — Fix (if `/dx-codespace fix`)

For each FAIL or WARN, present the change and ask to proceed:

```
Fix D — add BETTER_AUTH_URL to remoteEnv?

  Will add to devcontainer.json:
    "remoteEnv": {
      "BETTER_AUTH_URL": "https://${localEnv:CODESPACE_NAME}-3000.${localEnv:GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    }

Apply? (y)es / (s)kip / (x)cancel all
```

Apply each fix the user confirms. After all fixes:

1. Run `bun format` on any modified files to avoid lint noise
2. Print a summary of what was changed

---

## Step 5 — Remind about Codespaces secrets

Always print this reminder at the end, regardless of findings:

```
Reminder: sensitive env vars (DATABASE_URL, auth secrets, API keys) must be set as
Codespaces secrets — they are NOT read from .env inside the container.

Sync your .env:
  gh secret set --app codespaces -f .env

Manage secrets at:
  https://github.com/alvintoh/aether-flow/settings/secrets/codespaces
```

---

## What this skill does NOT fix

- Codespaces prebuilds — enable manually at repo Settings → Codespaces → Set up prebuild
- Missing `.env` values — secrets must be set by the user; this skill cannot read secret values
- Next.js compilation speed — inherent to Turbopack on 2-core Codespace; not a config issue
