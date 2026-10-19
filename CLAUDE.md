# Ideas Lab: repo rules

Extends `~/.claude/CLAUDE.md` and `~/.claude/rules/`. Where this file is more specific it wins;
it never relaxes a global rule unless it says so. This file is still being built up.

## Vercel

Each app is its own Vercel project, named `lab-<kebab-name>`, deployed by Vercel's GitHub
integration from `apps/<appName>`.

- **Use `tools/src/vercelApi.ts`, not the `vercel` CLI.** The CLI cannot run in the Claude Code
  sandbox. The sandbox gives `VERCEL_TOKEN` to sandboxed commands as a masked placeholder (the real
  token is substituted by the proxy on requests to `api.vercel.com`), and the CLI validates the
  token format on the client and rejects the placeholder before sending anything. The REST API
  works with the placeholder. Setup notes: `docs/agentSetup/vercel.md`.
- **The helper is deliberately minimal and must be maintained.** It only covers deploying an app:
  check a project exists, create it, make previews public, read the latest deployment of a
  branch, read build events. It pins endpoint versions in the path (`/v9`, `/v11`, ...). When
  Vercel changes or retires one, update the helper and its tests.
- **Do not grow it speculatively.** Add an API call only when the deploy flow needs it, with a
  test first.
- **Any other Vercel operation (anything the CLI does that the helper does not, such as deleting a
  project, domains, env vars, rollbacks, `vercel deploy`) is done by the user, outside the
  sandbox.** Do not work around this: do not unmask the token, do not call the API ad hoc with
  `curl`, and do not install or run the CLI in the sandbox. Tell the user the exact command to run
  in their own terminal and wait.
- Never print, log or inspect `VERCEL_TOKEN`. Test only that it is set (`[ -n "$VERCEL_TOKEN" ]`).
- Node's `fetch` does not use the sandbox proxy by default. Run these scripts with
  `NODE_USE_ENV_PROXY=1`.
