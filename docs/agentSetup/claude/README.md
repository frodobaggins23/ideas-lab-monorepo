# Claude Code project files to copy

The Claude Code sandbox cannot write these locations, so apply them from your own terminal at the
repo root:

```sh
mkdir -p .claude/skills
cp -r docs/agentSetup/claude/skills/* .claude/skills/
cp docs/agentSetup/claude/mcp.json .mcp.json
# merge docs/agentSetup/claude/settings.json into .claude/settings.json (do not overwrite it)
```

Also in `~/.claude/settings.json`:

- `sandbox.network.allowedDomains`: add `api.npmjs.org` (download counts) and
  `tuf-repo-cdn.sigstore.dev` (signature verification), and keep `*.vercel.com`, `*.vercel.app`,
  `registry.npmjs.org`.
- `sandbox.excludedCommands`: add exactly
  `npx serve -s .preview -l tcp://127.0.0.1:5173 -c ../tools/serve.json --no-compression --no-clipboard`
  (no wildcard) so the Playwright browser can reach a local build.

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
