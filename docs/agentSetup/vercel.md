# Vercel CLI in the Claude Code sandbox

The Vercel CLI authenticates with a masked `VERCEL_TOKEN`, the same way `gh` uses `GH_TOKEN`.
The sandbox only sees a placeholder; the real value is injected on requests to `api.vercel.com`.

## 1. Create the token

1. Vercel dashboard, Account Settings, Tokens, Create Token.
2. Scope: the team that owns the lab projects. Set an expiry.
3. Save it to a file only you can read:

    ```sh
    mkdir -p ~/.config
    install -m 600 /dev/null ~/.config/vercel-token
    # paste the token into the file, no trailing text
    ```

## 2. Export it from `~/.bashrc`

```sh
# Expose the Vercel token as VERCEL_TOKEN so Claude Code can mask it for sandboxed vercel calls.
# Only set it when unset, so a masked placeholder inside the sandbox is never overwritten.
if [ -z "${VERCEL_TOKEN:-}" ] && [ -r "$HOME/.config/vercel-token" ]; then
  VERCEL_TOKEN="$(cat "$HOME/.config/vercel-token")" && export VERCEL_TOKEN
fi
```

## 3. Sandbox settings (`~/.claude/settings.json`)

Add to `sandbox.credentials.envVars`:

```json
{ "name": "VERCEL_TOKEN", "mode": "mask", "injectHosts": ["api.vercel.com"] }
```

Add to `sandbox.network.allowedDomains`:

```json
"api.vercel.com", "vercel.com", "*.vercel.com"
```

`~/.config/vercel-token` is outside the readable paths, so the sandbox cannot read the file.

Optional, top-level `env`: `"VERCEL_TELEMETRY_DISABLED": "1"` stops the CLI from calling
`telemetry.vercel.com`.

## 4. Verify

Restart the host application (for VS Code, quit it completely) so Claude Code inherits
`VERCEL_TOKEN`, then ask Claude to call the REST API:

```sh
curl -sS -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v2/user
```

## Known limitation: the `vercel` CLI does not work in the sandbox

The CLI validates the token format on the client and rejects the masked placeholder
(`You defined "--token", but its contents are invalid. Must not contain: "-"`) before it makes any
request. Use the REST API (`curl` or `fetch` with `Authorization: Bearer $VERCEL_TOKEN`) instead.
Verified: `GET https://api.vercel.com/v2/user` returns 200 from inside the sandbox.
