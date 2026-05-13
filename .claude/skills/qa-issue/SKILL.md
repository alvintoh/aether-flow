---
name: qa-issue
description: >
  Create a structured GitHub issue from a bug description, QA findings, or live
  browser errors. Runs lightweight analysis if no input is given. Labels and
  formats the issue, then opens it via `gh issue create`.
  Use when the user says "create an issue", "file a bug", "log this as an issue",
  or after /qa findings.
argument-hint: "<bug description | QA findings | error message | leave blank for auto-detect>"
---

# QA Issue

Package a bug or quality finding into a well-structured GitHub issue and open it
with `gh issue create`. Keep analysis lightweight — this skill files issues, it
does not investigate deeply (use the `qa` agent for that).

## Arguments

- `/qa-issue <description>` — describe the bug, paste an error, or paste QA findings
- `/qa-issue` (no args) — auto-detect: pull Chrome console errors and run lint/typecheck

---

## Step 1 — Gather context

### If an argument was provided

Use it as the primary source. Extract:
- What is broken
- Where (file + line if known)
- How to reproduce

If the argument contains a QA findings block (from the `qa` agent), parse it directly — skip Step 1b.

### If no argument was provided (auto-detect)

Run the following in parallel:

**Chrome MCP:**
```
mcp__claude_in_chrome__get_console_logs     — capture errors and warnings
mcp__claude_in_chrome__get_network_requests — capture failed requests
```

**Static analysis:**
```bash
bun lint
bunx tsc --noEmit
```

Take the first (highest-severity) finding as the issue subject. If there are multiple
unrelated findings, ask the user: "Found N issues — file separately or together?"

---

## Step 2 — Classify

Determine the issue type and label set:

| Type | Labels |
|------|--------|
| Runtime crash or exception | `bug` |
| Wrong visual output | `bug`, `ui` |
| Failed network request / API error | `bug`, `backend` |
| TypeScript or lint error | `bug`, `dx` |
| Accessibility failure | `bug`, `accessibility` |
| Performance degradation | `performance` |
| Security concern | `bug`, `security` |
| Missing feature or improvement | `enhancement` |

Use the most specific labels that apply. Do not create new labels — use only those above.

---

## Step 3 — Draft the issue

Build the issue body using this template:

```markdown
## Description
<one paragraph: what is wrong, where, and the user impact>

## Steps to Reproduce
1. <step>
2. <step>
3. <step>

## Expected Behaviour
<what should happen>

## Actual Behaviour
<what actually happens — include exact error message if available>

## Evidence
<error message, stack trace, screenshot description, or lint output — paste verbatim>

## Environment
- Branch: `<current branch>`
- File: `<file:line if known>`
```

Keep it factual. Do not include fix suggestions in the issue body.

---

## Step 4 — Confirm before filing

Show the draft to the user:

```
Title:  <proposed title>
Labels: <label list>
Body preview:
  <first 8 lines of body>
  ...

File this issue? (y)es / (e)dit / (x)cancel
```

Wait for confirmation. If the user says `(e)dit`, accept their edits and re-show before filing.

---

## Step 5 — File the issue

```bash
gh issue create \
  --title "<title>" \
  --label "<label1>,<label2>" \
  --body "$(cat <<'EOF'
<full body>
EOF
)"
```

After creation, print:
```
Issue filed: <URL>
```

If `gh` is not authenticated or the repo has no remote, print:
```
gh is not authenticated or no remote found. Run `gh auth login` first.
```
and stop.

---

## Step 6 — If multiple findings

If the auto-detect step found more than one unrelated issue and the user chose "file separately":

Repeat Steps 3–5 for each finding. Print all URLs at the end:

```
Issues filed:
  #42 — <title 1>  <url>
  #43 — <title 2>  <url>
```

---

## Rules

- Never file an issue without user confirmation (Step 4)
- Never create new GitHub labels — use the approved set only
- Never include a suggested fix in the issue body — that belongs in a PR
- Never file duplicate issues — run `gh issue list --search "<keywords>" --limit 5` first
  and show matches to the user if any are found
- If `gh issue list` finds a likely duplicate, surface it: "Similar open issue: #<N> — <title>. File anyway?"
