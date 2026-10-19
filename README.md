# Ideas Lab

Nx monorepo used as a laboratory for app ideas. An idea becomes a folder in `apps/`, gets its own
Vercel project and a preview URL on its pull request. Apps that outgrow the lab move to their own
repository.

## Setup

```sh
nvm use          # Node 24, see .nvmrc
npm install
npm run prepare  # installs Git hooks (Husky)
```

## Layout

| Path     | Purpose                                                     |
| -------- | ----------------------------------------------------------- |
| `apps/`  | One Vite + React + TypeScript app per idea                  |
| `libs/`  | Shared code, imported as `@lab/<name>` (`config`, `ui`)     |
| `tools/` | Generators and scripts (new app, Vercel project, dep check) |
| `docs/`  | Recipes and setup notes for agents                          |

## Commands

| Command             | What it does            |
| ------------------- | ----------------------- |
| `npm run typecheck` | Typecheck all projects  |
| `npm run lint`      | ESLint all projects     |
| `npm run test:run`  | Run all unit tests once |
| `npm run build`     | Build all apps          |
| `npm run format`    | Format with Prettier    |

Use `npx nx affected -t <target>` to run a target only for projects changed since `main`.

## Running Nx in the Claude Code sandbox

Nx plugin workers need Unix sockets, which the sandbox blocks. Set `NX_ISOLATE_PLUGINS=false`
(and keep `useDaemonProcess` off) when running Nx from the sandbox.

## Tests

Logic in `libs/*` is developed test first. Apps test important logic and services only.
