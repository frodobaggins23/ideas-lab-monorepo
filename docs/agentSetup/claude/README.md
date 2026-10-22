# Claude Code project files to copy

The Claude Code sandbox cannot write these locations, so apply them from your own terminal at the
repo root:

```sh
mkdir -p .claude/skills
cp -r docs/agentSetup/claude/skills/* .claude/skills/
cp docs/agentSetup/claude/mcp.json .mcp.json
# merge docs/agentSetup/claude/settings.json into .claude/settings.json (do not overwrite it)
```

Re-run the `cp` of the skills after every change to `docs/agentSetup/claude/skills/`. The agent
can only edit these templates, and nothing warns when the live copies in `.claude/skills/` fall
behind: an outdated `ship-app` once made it create the Vercel project after the push, so no
preview was ever built. Check for drift with:

```sh
diff -r docs/agentSetup/claude/skills .claude/skills
```

`.claude/settings.json` is the shared project file and is committed. Personal or experimental
settings go in `.claude/settings.local.json`, which is gitignored.

Also in `~/.claude/settings.json`:

- `sandbox.network.allowedDomains`: add `api.npmjs.org` (download counts) and
  `tuf-repo-cdn.sigstore.dev` (signature verification), and keep `*.vercel.com`, `*.vercel.app`,
  `registry.npmjs.org`.
- `sandbox.excludedCommands`: add exactly
  `npx serve -s .preview -l tcp://127.0.0.1:5173 -c ../tools/serve.json --no-compression --no-clipboard`
  (no wildcard) so the Playwright browser can reach a local build.

## Pushing from the sandbox

The agent pushes with `npm run lab:push`, never with `git push`.

- **Why not `git push`:** git sends `GH_TOKEN` base64-encoded in a Basic auth header, and the
  proxy only replaces the masked placeholder where it appears as plain text, so GitHub receives
  the placeholder (tested 2026-10-22). Do not exclude `git push` from the sandbox instead: a git
  command run outside the sandbox also runs the repo hooks (`.husky/`, which runs `nx` and the
  tests) with your full rights.
- **How `lab:push` works:** it first runs `.husky/pre-push` inside the sandbox. Then
  `tools/src/pushBranch.ts` recreates each new local commit through the GitHub Git Data API on
  `api.github.com`, where the proxy does inject the token. It moves the branch only after every
  recreated commit came back with its exact local id, so GitHub holds exactly the local history.
  It refuses the default branch, anything that is not a fast-forward, signed commits and
  submodule changes.
- **Setup:** mask `GH_TOKEN` in `~/.claude/settings.json` with `injectHosts: ["api.github.com"]`,
  and add the allow rule `Bash(npm run lab:push)` to `.claude/settings.json` or
  `.claude/settings.local.json` yourself. Without it, auto mode stops the command as a sandbox
  bypass. The template does not contain the rule on purpose: adding it is your review of the
  tool, and auto mode does not let the agent grant it to itself.
- **Fetching stays with you:** `git fetch` and `git pull` use SSH, which the sandbox cannot reach.
  For a new branch, `lab:push` needs the current head of `main` in your local repository.

Use a fine-grained token for `GH_TOKEN` that covers only this repository, with read and write on
Contents and Pull requests. On GitHub, add a ruleset for `main` that requires a pull request and
blocks force-pushes and deletion, with yourself as a bypass actor. Then "never push to `main`,
never force-push" no longer depends on the agent following instructions.

## Permission rules

- The `Edit(...)` deny rules in `settings.json` protect the files that the security setup itself
  depends on: Claude Code settings and skills, git hooks, `.npmrc`, the `serve` config and the
  dependency allowlist. Claude's file tools are bound by permission rules, not by the sandbox,
  and once wrote into `.claude/skills/`. The same rules also make these paths read-only for
  sandboxed commands (tested 2026-10-22).
- A `Read(**/.env.*)` deny rule wins over any `allow` rule, `Read(**/.env.example)` included.
  That is why env templates are named `env.example` and every `.env*` file is gitignored.
- Hooks in `settings.json` and `settings.local.json` run outside the sandbox. Never point a hook at
  a script inside the repo: the agent can write there, so it could run its own code unsandboxed.
  Put hook scripts in `~/.claude/hooks/`.

## Vercel dashboard

"Redeploy" on a deployment rebuilds that deployment's commit, not the newest commit of the branch.
To deploy a fix, redeploy the deployment of the fix commit, or push again.

## Dependency gate

Agents add packages through `npm run lab:add`, which checks a package before installing it. The
`deny` permission rules in `settings.json` block a direct `npm install` and npm's built-in aliases
for it (`i`, `add`, `in` … `isntall`, `it`, `install-test`); a bare `npm install` is denied too,
`npm ci` is not. They match the command text, so they stop accidental retries, not deliberate
rephrasing such as a flag before the subcommand.

There is no override. When a check fails nothing is installed, the agent reports why, and you
decide: if you accept the risk, run the command it prints in your own terminal, outside the sandbox
(`npm install --save-exact <package> ...`). App scaffolding runs `npm install` internally, so new
apps still register in the lockfile.

Test it: ask Claude to run `npm run lab:add -- http-server -w @lab/lab-example`. It must refuse and
print the report. A direct `npm install date-fns` must be denied.

## Notes

- The Playwright MCP runs outside the Bash sandbox. Its isolation comes from its own flags:
  headless, isolated profile, and `--allowed-origins` limited to localhost and `*.vercel.app`.
- Verify after applying: ask Claude to run `npm run lab:check-package -- recharts` and to open a
  local build through the Playwright MCP (see the `inspect-app` skill).
