---
name: claude-sync
description: >
  Copy the current project's .claude folder into another project, overwriting
  the destination. Use when you want to push updated skills, agents, or settings
  to another repo. Always shows a diff summary and asks for confirmation first.
disable-model-invocation: true
argument-hint: "<destination-project-path>"
---

# Sync .claude to Another Project

Copy this project's `.claude/` folder into a destination project, overwriting
whatever is already there. Always confirms before writing anything.

## Step 1: Resolve the destination

If the user provided a path as an argument, use it directly.

If no argument was given, ask the user:

```
Which project do you want to sync .claude into?
Provide the full path to the destination project root.
```

Expand `~` if present. Verify the destination directory exists:

```bash
[ -d "<destination>" ] && echo "EXISTS" || echo "NOT FOUND"
```

If it does not exist, tell the user and stop.

---

## Step 2: Show what is currently there

List what exists in the destination's `.claude/` folder (if any):

```bash
if [ -d "<destination>/.claude" ]; then
  find "<destination>/.claude" -not -path '*/memory/*' | sort
else
  echo "(no .claude folder at destination)"
fi
```

List what will be copied from this project:

```bash
find .claude -not -path '*/memory/*' | sort
```

Note: the `memory/` directory is always excluded — memories are project-specific
and should never be overwritten.

---

## Step 3: Show the diff summary

Compare the two and produce a human-readable summary:

```bash
# Files in source only (will be added)
comm -23 \
  <(find .claude -not -path '*/memory/*' -type f | sed 's|^\.claude/||' | sort) \
  <(find "<destination>/.claude" -not -path '*/memory/*' -type f 2>/dev/null | sed "s|^<destination>/.claude/||" | sort)

# Files in destination only (will be deleted)
comm -13 \
  <(find .claude -not -path '*/memory/*' -type f | sed 's|^\.claude/||' | sort) \
  <(find "<destination>/.claude" -not -path '*/memory/*' -type f 2>/dev/null | sed "s|^<destination>/.claude/||" | sort)

# Files in both (will be overwritten)
comm -12 \
  <(find .claude -not -path '*/memory/*' -type f | sed 's|^\.claude/||' | sort) \
  <(find "<destination>/.claude" -not -path '*/memory/*' -type f 2>/dev/null | sed "s|^<destination>/.claude/||" | sort)
```

Present it clearly to the user:

```
Source:      <current project path>/.claude
Destination: <destination>/.claude

  ADDED   (new files)      — X files
  REMOVED (deleted files)  — X files
  UPDATED (overwritten)    — X files

  memory/ excluded from sync (always project-specific)
```

List the individual files under each category so the user can see exactly what changes.

---

## Step 4: Confirm

Ask the user to confirm before proceeding:

```
Proceed with sync? This will overwrite <destination>/.claude (except memory/).
(y)es / (n)o
```

If the user types `n` or `no`, print `Sync cancelled.` and stop.
If the user types anything other than `y` or `yes`, print `Sync cancelled.` and stop.

---

## Step 5: Sync

Delete the destination `.claude/` excluding `memory/`, then copy from source:

```bash
# Preserve destination memory if it exists
if [ -d "<destination>/.claude/memory" ]; then
  cp -r "<destination>/.claude/memory" /tmp/_claude_memory_backup
fi

# Remove old destination .claude
rm -rf "<destination>/.claude"

# Copy source .claude
cp -r .claude "<destination>/.claude"

# Restore destination memory
if [ -d /tmp/_claude_memory_backup ]; then
  rm -rf "<destination>/.claude/memory"
  mv /tmp/_claude_memory_backup "<destination>/.claude/memory"
fi
```

---

## Step 6: Verify and report

Confirm the copy succeeded:

```bash
find "<destination>/.claude" -not -path '*/memory/*' | sort
```

Report:
- How many files were synced
- Destination path
- Whether memory/ was preserved

---

## Step 7: Update agents/skills sections in destination CLAUDE.md

The destination `CLAUDE.md` is project-specific — do **not** overwrite it.
Instead, update only the agents and skills reference sections to match the
newly synced `.claude/` folder.

### 7a: Read both files

Read the destination `CLAUDE.md` and the source `CLAUDE.md`. If the destination
has no `CLAUDE.md`, skip this step and say so.

### 7b: Derive the new agents and skills content

From the synced `.claude/agents/` files, build an agents table. From the synced
`.claude/skills/` files, build a skills table. Use the frontmatter `name` and
`description` fields from each file as the table rows.

### 7c: Locate the sections to replace

Find the agents section and skills section in the destination `CLAUDE.md`. They
may be under any heading that references agents or skills (e.g. `## Agents`,
`## Project Agents`, `## Project Skills`, `## Skills`). Identify the full span
of each section — from its heading line to the line before the next `##` heading
(or end of file).

### 7d: Show what will change

Print a brief before/after for each section being updated. Then ask:

```
Update agents/skills sections in destination CLAUDE.md?
(y)es / (n)o
```

If `n` or `no`, print `CLAUDE.md left unchanged.` and stop.

### 7e: Write the updated file

Replace only the identified sections in the destination `CLAUDE.md` with the
new tables. Leave all other content (project overview, stack, commands, gotchas,
etc.) exactly as-is. Write the file back.

Confirm: `CLAUDE.md agents/skills sections updated.`
