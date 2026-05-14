---
name: perms-tune
description: >
  Scan your transcripts for common read-only Bash and MCP tool calls, then add a prioritized
  allowlist to project .claude/settings.json to reduce permission prompts.
---

# Perms Tune

Look through my transcripts' MCP and bash tool calls, and based on those, make a prioritized list of patterns that I should add to my permission allowlist to reduce permission prompts. Focus on read-only commands.

The format for permissions is: `Bash(foo*)`, `Bash(foo)`, `Bash(foo bar *)`, `mcp__slack__slack_read_thread`, etc.

Then, add these to the project `.claude/settings.json` under `permissions.allow`.

## Steps

1. **Locate transcripts.** Session transcripts live at `~/.claude/projects/<sanitized-cwd>/*.jsonl`. Each line is a JSON object. Tool calls appear as `assistant` messages with `message.content[]` entries of `type: "tool_use"`. The `name` field identifies the tool (e.g. `"Bash"`, `"mcp__slack__slack_read_thread"`); for Bash, `input.command` is the shell string.

   Scan the recent transcripts across the user's projects dir — not just the current project — so the allowlist reflects their actual usage. Cap the scan at a reasonable number of recent sessions (e.g. 50 most-recently-modified JSONL files) so this stays fast.

2. **Extract tool-call frequencies using `bun` or `py`.**

   On Windows, `python3` may redirect to the Microsoft Store. Use `py` instead. Prefer `bun` if the project uses it; fall back to `py`. Never use `python3` directly on Windows.

   Use the following `bun` script (or equivalent `py` script) to parse transcripts:

   ```js
   // bun -e "<script>"
   const fs = require('fs'), path = require('path');
   const projectsDir = path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'projects');

   function walk(dir) {
     let files = [];
     try {
       for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
         const full = path.join(dir, e.name);
         if (e.isDirectory()) files = files.concat(walk(full));
         else if (e.name.endsWith('.jsonl')) files.push(full);
       }
     } catch(e) {}
     return files;
   }

   let files = walk(projectsDir);
   files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
   files = files.slice(0, 50);

   const bash = {}, mcp = {};
   for (const f of files) {
     try {
       for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
         if (!line.trim()) continue;
         try {
           const { message: msg = {} } = JSON.parse(line);
           if (msg.role !== 'assistant') continue;
           for (const item of (msg.content || [])) {
             if (!item || item.type !== 'tool_use') continue;
             if (item.name === 'Bash') {
               const tokens = (item.input?.command || '').trim().split(/\s+/);
               let i = 0;
               while (i < tokens.length && tokens[i].includes('=')) i++;
               if (i >= tokens.length) continue;
               const key = (i+1 < tokens.length && !tokens[i+1].startsWith('-'))
                 ? tokens[i] + ' ' + tokens[i+1] : tokens[i];
               bash[key] = (bash[key] || 0) + 1;
             } else if (item.name?.startsWith('mcp__')) {
               mcp[item.name] = (mcp[item.name] || 0) + 1;
             }
           }
         } catch(e) {}
       }
     } catch(e) {}
   }

   console.log('=== BASH ===');
   Object.entries(bash).sort((a,b)=>b[1]-a[1]).slice(0,50)
     .forEach(([k,v]) => console.log(v.toString().padStart(4) + '  ' + k));
   console.log('\n=== MCP ===');
   Object.entries(mcp).sort((a,b)=>b[1]-a[1])
     .forEach(([k,v]) => console.log(v.toString().padStart(4) + '  ' + k));
   ```

   For Bash calls: take the leading command token (skipping env-var prefixes). Record the command + first non-flag subcommand pair (e.g. `git status`, `gh pr view`, `bun lint`).
   For MCP calls: record the full tool name.

3. **Filter to read-only.** Keep only commands that don't mutate state. Examples of read-only: `ls`, `cat`, `pwd`, `git status`, `git log`, `git diff`, `git show`, `git branch`, `rg`, `grep`, `find`, `head`, `tail`, `wc`, `file`, `which`, `echo`, `date`, `gh pr view`, `gh pr list`, `gh pr diff`, `gh issue view`, `gh issue list`, `gh run list`, `gh run view`, `gh api` (GET), `bun run typecheck`, `bun run lint`, `bun lint`, `bun typecheck` (for lint/typecheck that don't mutate), `docker ps`, `docker logs`, `kubectl get`, `kubectl describe`, `ps`, `top`, `df`, `du`, `env`, `printenv`, any MCP tool with `read`/`get`/`list`/`search`/`view` in its name.

   Drop anything that writes, deletes, renames, pushes, merges, installs, or runs a build/test that has side effects. When in doubt, leave it out.

   **Never allowlist a pattern that grants arbitrary code execution.** A wildcard rule for any of these (e.g. `Bash(python3:*)`) is equivalent to allowing arbitrary code execution. This list is not exhaustive — apply the same rule to anything in the same category:
   - Interpreters: `python`/`python3`/`py`, `node`, `bun`, `deno`, `ruby`, `perl`, `php`, `lua`, etc.
   - Shells: `bash`, `sh`, `zsh`, `fish`, `eval`, `exec`, `ssh`, etc.
   - Package runners: `npx`, `bunx`, `uvx`, `uv run`, etc.
   - Task-runner wildcards: `npm run *`, `yarn run *`, `pnpm run *`, `bun run *`, `make *`, `just *`, `cargo run *`, `go run *`, etc. — an exact `Bash(bun run typecheck)` is fine, `Bash(bun run *)` is not. Similarly `Bash(bun lint)` and `Bash(bun typecheck)` are exact named scripts and are safe; `Bash(bun *)` is not.
   - `gh api *`, `docker run`/`exec`, `kubectl exec`, `sudo`, and similar

4. **Drop commands Claude Code already auto-allows.** These don't need an allowlist entry — they never prompt. If you see any of these in the transcripts, skip them; don't suggest them to the user.

   - **Always auto-allowed (any args):** `cal`, `uptime`, `cat`, `head`, `tail`, `wc`, `stat`, `strings`, `hexdump`, `od`, `nl`, `id`, `uname`, `free`, `df`, `du`, `locale`, `groups`, `nproc`, `basename`, `dirname`, `realpath`, `cut`, `paste`, `tr`, `column`, `tac`, `rev`, `fold`, `expand`, `unexpand`, `fmt`, `comm`, `cmp`, `numfmt`, `readlink`, `diff`, `true`, `false`, `sleep`, `which`, `type`, `expr`, `test`, `getconf`, `seq`, `tsort`, `pr`, `echo`, `printf`, `ls`, `cd`, `find`.
   - **Auto-allowed with zero args only:** `pwd`, `whoami`, `alias`.
   - **Auto-allowed exact forms:** `claude -h`, `claude --help`, `node -v`, `node --version`, `python --version`, `python3 --version`, `ip addr`.
   - **Auto-allowed with safe flags only (validated):** `xargs`, `file`, `sed` (read-only expressions), `sort`, `man`, `help`, `netstat`, `ps`, `base64`, `grep`, `egrep`, `fgrep`, `sha256sum`, `sha1sum`, `md5sum`, `tree`, `date`, `hostname`, `info`, `lsof`, `pgrep`, `tput`, `ss`, `fd`, `fdfind`, `aki`, `rg`, `jq`, `uniq`, `history`, `arch`, `ifconfig`, `pyright`.
   - **All git read-only subcommands:** `git status`, `git log`, `git diff`, `git show`, `git blame`, `git branch`, `git tag`, `git remote`, `git ls-files`, `git ls-remote`, `git config --get`, `git rev-parse`, `git describe`, `git stash list`, `git reflog`, `git shortlog`, `git cat-file`, `git for-each-ref`, `git worktree list`, etc.
   - **All gh read-only subcommands:** `gh pr view`, `gh pr list`, `gh pr diff`, `gh pr checks`, `gh pr status`, `gh issue view`, `gh issue list`, `gh issue status`, `gh run view`, `gh run list`, `gh workflow list`, `gh workflow view`, `gh repo view`, `gh release view`, `gh release list`, `gh api` (GET), `gh auth status`, etc.
   - **Docker read-only subcommands:** `docker ps`, `docker images`, `docker logs`, `docker inspect`.

   Also check the existing `settings.local.json` and `settings.json` for permissions already granted. If `Bash(*)` is already present in `settings.local.json`, note this to the user — it means all Bash prompts are already suppressed locally, and `settings.json` entries serve collaborators rather than the current user.

5. **Pick the pattern form.** Use the narrowest pattern that still covers the observed usage:
   - If the user runs many variants (`git log`, `git log --oneline`, `git log main..HEAD`): use `Bash(git log *)` — note the space before `*`, which is required for prefix matching to work correctly.
   - If a single exact invocation is common: use `Bash(foo)` with no wildcard.
   - For commands that appear both standalone and with pipes/args (e.g. `bun lint` and `bun lint 2>&1 | head -60`), add both the exact form `Bash(bun lint)` and the wildcard form `Bash(bun lint *)`.
   - For MCP: use the full tool name verbatim (no wildcard needed; they're already specific).
   - Never widen a pattern to the point that it conflicts with the rules above (no arbitrary code execution, no mutation/side effects).

6. **Prioritize.** Rank by count descending. Drop anything that appeared fewer than ~3 times — not worth the allowlist entry. Cap the list at the top ~20 so the user can skim it.

7. **Present the prioritized list to the user** as a markdown table with columns: rank, pattern, count, one-line description. Example:

   | # | Pattern | Count | Notes |
   |---|---------|-------|-------|
   | 1 | `Bash(git status *)` | 142 | repo status checks |
   | 2 | `Bash(gh pr view *)` | 87 | PR inspection |
   | 3 | `mcp__slack__slack_read_thread` | 54 | Slack thread reads |

8. **Merge into `.claude/settings.json`** in the current project (not `~/.claude/settings.json`, not `.claude/settings.local.json`). Create the file if it doesn't exist. Preserve existing keys and existing entries in `permissions.allow`; de-duplicate against what's already there; don't remove anything; don't reorder unrelated fields.

9. **Report back.** Tell the user what you added (count + a few examples), what was already in the allowlist, and what you skipped and why (e.g. "dropped `rm` and `git push` — not read-only; dropped `cat`/`ls`/`git status` — already auto-allowed, no rule needed"). If `Bash(*)` is present in `settings.local.json`, note that all Bash prompts are already suppressed locally and the new entries in `settings.json` benefit collaborators.

Do not add anything to `permissions.deny` or `permissions.ask`. Do not touch any other settings field.
