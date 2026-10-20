---
name: ship-app
description: Ship an app in this lab repo - branch, commit, push, draft pull request, Vercel project and preview URL. Use after verify-app passes, or to push follow-up changes to an existing app PR.
---

# ship-app

Input: `appName`. Rules for what the agent may do on its own are in the root `CLAUDE.md`
("Git and pull requests"). Never commit to `main`, force-push, skip hooks, merge or delete branches.

1. **Branch:** `feat/<appName>` for a new app, `fix/<appName>-<topic>` for later changes. Reuse the
   existing branch if it already exists.
2. **Commit:** one logical change per commit, Conventional Commits, English. Let the hooks run; if
   one fails, fix the cause.
3. **Vercel project** (first ship only, before the first push: Vercel deploys only pushes made
   after the project exists): `npm run lab:vercel-project -- <appName>`. It is idempotent. Any
   other Vercel operation is the user's to run outside the sandbox: tell them the command.
4. **Push** the branch and open a **draft** PR with `gh pr create --draft` (or push to the existing PR).
   Body: the idea, preview URL (fill in below), checks run with results, Assumptions, new
   dependencies added through `lab:add` (and any package the user installed themselves after a
   failed check, with the failed check), open questions.
5. **Preview URL:** `npm run lab:deployment -- <appName>` (run it in the background; it waits up
   to 15 minutes) waits for the deployment of the pushed commit and prints `READY <url>`. On
   `ERROR` it prints the build log: fix the cause and push again. `CANCELED` means Vercel skipped
   the build because nothing in the app changed. Add the URL to the PR.
6. Run `inspect-app` against the preview URL. Report the PR link, the preview URL and what was not
   verified.
