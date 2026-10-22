# Ideas Lab: repo rules

Extends `~/.claude/CLAUDE.md` and `~/.claude/rules/`. This file is more specific and wins, but it
only narrows or extends global rules. Each place it relaxes one is marked **Override**.

This repo is a laboratory for app ideas. The goal is to go from an idea to a draft PR with a live
Vercel preview quickly and with little supervision. It is not for long-term development: an idea
that survives moves to its own repository.

## Layout

```
apps/<appName>/   one Vite + React + TypeScript SPA per idea (optional api/ for Vercel Functions)
libs/ui           shared Tailwind components
libs/config       Zod env validation (parseEnv)
tools/            scripts, templates and tests (new app, Vercel, dependency check)
docs/agentSetup/  setup the user applies outside the sandbox (settings, skills, token)
```

- npm workspaces + Nx. Shared tsconfig, ESLint and Prettier live at the root; apps extend them.
- Node 24 (`.nvmrc`). Commit `package-lock.json`.
- New app: `npm run lab:new-app -- <appName>`. Do not copy folders by hand.

## Naming

- App folder is camelCase (`apps/budgetBuddy`). The scaffolder derives the rest, so type only the
  camelCase name:
    - npm and Nx project: `@lab/budget-buddy`
    - Vercel project: `lab-budget-buddy`
    - branch: `feat/budgetBuddy`
- Libs are imported as `@lab/<name>`; inside an app `@/` maps to `src/`.

## Stack

- React, TypeScript (strict), Vite, Vitest, Tailwind CSS, `@lab/ui` for shared components.
- React Router, Zustand and TanStack Query are pre-approved but wired in only when the idea needs
  them. Plain React state is enough for small ideas.
- Out of scope unless the user asks: databases, authentication, analytics, LLM calls, E2E tests.
- A backend, when an idea truly needs one, is plain Vercel Functions in `apps/<name>/api/`.
  Environment variables are validated with `parseEnv` from `@lab/config`.

## Apps must not be indexed

Every app ships with these and must keep them:

- `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">` in `index.html`
- `public/robots.txt` with `Disallow: /`
- an `X-Robots-Tag: noindex, nofollow, noarchive` header in `vercel.json`

The scaffolder adds all three. Do not remove them, and do not add anything that makes an app
discoverable (sitemaps, canonical or Open Graph URLs for search).

## Exports and imports

- Named exports only; no default exports except where a tool requires them.
- **Override:** barrel files (`index.ts`) are allowed in `libs/*` only, as the public entry point.
  Apps import from concrete files.

## Testing

- **Override of the global TDD rule:** TDD (red, green, refactor) applies to `libs/*` and
  `tools/`. In `apps/*` build the prototype first and then unit-test only important logic and
  services. Do not test presentational components. Say so in the PR body when skipping tests.
- `typecheck`, `lint`, `test:run` and `build` must pass for every affected project. Use
  `npx nx affected -t <target>` or `npx nx run-many -t <target>`.

## Git and pull requests

- **Override of "never commit or push unless asked":** the agent may, without asking, create a
  branch `feat/<appName>` or `fix/<appName>-<topic>`, commit there (Conventional Commits, hooks
  must pass), push that branch and open a **draft** PR with `gh`.
- Still forbidden without being asked: committing to `main`, force-push, `--no-verify`, merging or
  closing PRs, deleting branches.
- PR title is a Conventional Commit. PR body: the idea in a few lines, the preview URL, which checks
  ran and their result, an **Assumptions** list, any new dependencies with the result of
  `npm run lab:check-package`, and open questions.
- Stop and ask before: changing `libs/*` or root config in a way that affects other apps, anything
  involving secrets, and a failed dependency check.

## Dependencies

- **Override of "ask before adding any runtime dependency":** a runtime dependency may be added to
  `apps/<name>/package.json` without asking if it passes the dependency check. Never add runtime
  dependencies to the root or `libs/*` without asking, nor anything that needs a native build or a
  paid account or API key.
- **Add packages only with `npm run lab:add -- <package[@range]> [-D] [-w <workspace>]`.** It
  checks the package and installs it (exact version) only if the check passes. The check requires
  at least 100k weekly downloads, a release within 12 months, no deprecation, no high or critical
  `npm audit` findings, valid registry signatures and no install scripts in the dependency tree,
  checked in a dry-run install. Direct `npm install <package>` and its aliases are denied by
  permission rules. `npm run lab:check-package -- <package>` runs the check alone.
- **Install scripts of dependencies are blocked by npm itself** (`strict-allow-scripts` in the
  root `.npmrc`): one not listed in `allowScripts` in the root `package.json` fails the install.
  Only the user approves one (`npm install-scripts approve <pkg>`) or bypasses the policy.
- **There is no override. When `lab:add` fails, nothing is installed and only the user can
  install the package**, outside the sandbox:
    1. Do not try another way to install that package.
    2. Tell the user which package failed and why (quote the report). Offer an alternative package
       if there is a sensible one, and give them the exact command from the report
       (`npm install --save-exact <package> ...`) to run in their own terminal if they decide to
       accept the risk.
    3. Wait. After they confirm they ran it, check with `npm ls <package>` and continue.
    4. In an unattended session, do not wait on it: use an alternative, build the feature without
       the package, or leave it out, and say so in the PR body.
- Do not work around this: no hand-editing `package.json` followed by `npm install`, no `npx` of
  unchecked packages, no calling `tools/src/addPackage.ts` directly.
- `npm run lab:new-app` runs `npm install` itself to register the new workspace in the lockfile.
- Pre-approved packages are listed in `tools/dependencyAllowlist.json`. Only the user edits it.

## Vercel

Each app is its own Vercel project, named `lab-<kebab-name>`, deployed by Vercel's GitHub
integration from `apps/<appName>`. Previews are public. Create the project with
`npm run lab:vercel-project -- <appName>` (idempotent).

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
- Cleaning up abandoned Vercel projects is undecided; do not delete anything.

## Sandbox notes

- Run Nx with `NX_ISOLATE_PLUGINS=false` (set in the Claude Code `env` setting); Nx plugin workers
  cannot create Unix sockets in the sandbox.
- Node's `fetch` ignores the sandbox proxy. Run scripts that call the network with
  `NODE_USE_ENV_PROXY=1` (the `lab:*` npm scripts already do).
- **Override of "provide `.env.example`":** env templates are named `env.example` (no leading dot),
  in the repo root and in every app. The sandbox replaces every `.env*` file with an empty device,
  and a tracked one breaks git (status, stash, checkout and the commit hook), so all `.env*` files
  are gitignored and none may be tracked. Real values go in `.env.local`.
- Each sandboxed command has a private loopback, so a server started in the sandbox cannot be
  reached by the Playwright MCP browser (which runs outside it). To inspect an app locally, build
  it into the fixed folder `.preview` (`npm run build -w @lab/<kebab-name> -- --outDir
../../.preview --emptyOutDir`) and serve it with exactly
  `npx serve -s .preview -l tcp://127.0.0.1:5173 -c ../tools/serve.json --no-compression --no-clipboard`. The user
  excluded exactly that command from the sandbox, with no wildcard. It serves static files only,
  so no project code runs outside the sandbox. `-c ../tools/serve.json` is deliberate: without it `serve` reads a `serve.json` from the served folder, and its `public` key can point at any directory the user can read. Never edit `tools/serve.json`. Do not change or extend the command and never run
  other servers outside the sandbox. Stop the server when done and check that port 5173 is free.
- `.git/config` and `.git/hooks` are write-protected. Git hooks are installed by the user running
  `npm run prepare` outside the sandbox.

## Skills

- `new-app`: turn an idea into an app: scaffold, build the prototype, verify, ship.
- `verify-app`: run the quality gates for an app and look at it in a browser.
- `ship-app`: branch, commit, push, draft PR, Vercel project, preview URL, report.
- `inspect-app`: visually check a running app (local or deployed) with the Playwright MCP.

## Report format

Follow the global report format. For an app delivery also state the PR link, the preview URL, the
assumptions made, and anything skipped or unverified.
