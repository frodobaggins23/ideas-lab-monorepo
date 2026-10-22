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

The agent commits and pushes inside the sandbox, so git hooks (which run repo code such as tests)
stay sandboxed too. The `env` block in `settings.json` makes git use `gh` for credentials and
push over HTTPS even though `origin` is SSH. It sets this through environment variables because
the sandbox cannot write `.git/config` or `~/.gitconfig`, and it only affects Claude Code's
commands, not your terminal.

1. In `~/.claude/settings.json`, let the proxy inject the GitHub token for `github.com` (git)
   as well as `api.github.com` (`gh`), in `sandbox.credentials.envVars`:

    ```json
    { "name": "GH_TOKEN", "mode": "mask", "injectHosts": ["api.github.com", "github.com"] }
    ```

2. Remove any `git` command from `sandbox.excludedCommands`. A git command run outside the sandbox
   also runs the repo's hooks (`.husky/`, which runs `nx` and the tests) with your full rights.
3. Restart the host application, then ask Claude to run `git push --dry-run origin HEAD`. It
   authenticates but changes nothing.

If step 3 fails with `Invalid username or token`, the proxy does not replace the token inside
git's Basic auth header (git sends it base64-encoded). Then pushing stays with you until that is
solved. Do not fall back to excluding `git push` from the sandbox: see above.

Use a fine-grained token for `GH_TOKEN` that covers only this repository, with read and write on
Contents and Pull requests. On GitHub, add a ruleset for `main` that requires a pull request and
blocks force-pushes and deletion, with yourself as a bypass actor. Then "never push to `main`,
never force-push" no longer depends on the agent following instructions.

## Permission rules

- The `Edit(...)` deny rules in `settings.json` protect the files that the security setup itself
  depends on: Claude Code settings and skills, git hooks, `.npmrc`, the `serve` config and the
  dependency allowlist. The sandbox alone does not cover them: Claude's file tools are bound by
  permission rules, not by the sandbox, and once wrote into `.claude/skills/`.
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
