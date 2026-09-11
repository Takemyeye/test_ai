# Development

## Prerequisites

- Node.js 24. The API (`api/index.ts`) and the tests are run as TypeScript directly by Node, relying on built-in type stripping; `tsconfig.json` sets `erasableSyntaxOnly` to keep the code within that subset. The Docker images use `node:24-alpine`.
- npm (the lockfile is `package-lock.json`).
- An OpenRouter API key for real answers. Everything except the model call works without one; `/api/ask` then returns 502.
- Docker 20+ with Compose v2 for the container workflow (optional).

## Environment variables

Copy [`.env.example`](../.env.example) to `.env` and fill in the key. `.env*` is git-ignored except `.env.example`.

| Variable | Default | Read by | Purpose |
| --- | --- | --- | --- |
| `OPENROUTER_API_KEY` | none | `api/src/addons/openrouter.ts` | Bearer token for OpenRouter. Required for `/api/ask` to succeed. |
| `AI_MODEL` | `openai/gpt-4o-mini` | `api/src/addons/openrouter.ts` | OpenRouter model id. |
| `API_PORT` | `4000` | `api/index.ts` | Port the Express server listens on. |
| `API_HOST` | `127.0.0.1` | `api/index.ts` | Bind address. Compose sets `0.0.0.0`. Not in `.env.example`. |
| `API_URL` | `http://localhost:4000` | `next.config.ts` | Where the `/api/*` rewrite forwards to. Read when the Next config loads (dev start or build). The Dockerfile bakes in `http://api:4000`. |

The API process loads `.env` through Node's `--env-file-if-exists=.env` flag (see `scripts/run.mjs`), so a missing file is not an error. Next.js loads `.env` itself.

## Scripts

From [`package.json`](../package.json):

| Command | What it does |
| --- | --- |
| `npm run dev` | `node scripts/run.mjs dev`: starts `next dev` (port 3000) and `node --watch --env-file-if-exists=.env api/index.ts` (port 4000) as two child processes with inherited stdio. If either exits, the other is killed and the script exits with that code; Ctrl-C stops both. |
| `npm run build` | `next build`. Produces the standalone server in `.next/standalone` because of `output: "standalone"`. |
| `npm start` | `node scripts/run.mjs start`: `next start` plus `node --env-file-if-exists=.env api/index.ts` (no watch). Run `npm run build` first. |
| `npm run lint` | `eslint` with the flat config in `eslint.config.mjs` (`eslint-config-next` core-web-vitals and typescript presets). |
| `npm run typecheck` | `tsc --noEmit` over the whole repo, including `api/`, `lib/` and `tests/`. |
| `npm test` | `node --test "tests/**/*.test.ts"`. See [testing.md](testing.md). |

Open http://localhost:3000 after `npm run dev`. The browser talks only to port 3000; `/api/*` is proxied to 4000 by the rewrite in `next.config.ts`. `.claude/launch.json` has a `dev` configuration that runs `npm run dev` and previews port 3000.

## Docker

```bash
cp .env.example .env          # put your key into OPENROUTER_API_KEY
docker compose up --build -d
docker compose logs -f web
docker compose down
```

One multi-stage [`Dockerfile`](../Dockerfile) with four stages:

| Stage | Contents |
| --- | --- |
| `deps` | `npm ci` with the full dependency set. |
| `build` | Copies the repo, sets `API_URL` (build arg, default `http://api:4000`), runs `npm run build`. |
| `web` | Runtime for Next: copies `.next/standalone`, `.next/static` and `public/`, runs as user `nextjs`, `node server.js` on port 3000, healthcheck on `/`. |
| `api` | Runtime for Express: `npm ci --omit=dev`, copies only `lib/` and `api/`, runs as user `api`, `node api/index.ts` on port 4000 bound to `0.0.0.0`, healthcheck on `/health`. |

[`docker-compose.yml`](../docker-compose.yml) builds `web` and `api` from those targets. `web` publishes `127.0.0.1:3000` and waits for `api` to be healthy; `api` only `expose`s 4000 on the Compose network and reads `.env` via `env_file`. Both share a hardening block: read-only root filesystem with a tmpfs `/tmp`, `no-new-privileges`, all capabilities dropped, PID limit 128, `restart: unless-stopped`, and memory limits of 512 MB (`web`) and 256 MB (`api`). `.dockerignore` excludes `node_modules`, `.next`, `.git`, `.env*` (except the example), `.claude`, `README.md` and `PROMPTS.md`.

Changing `AI_MODEL` only needs a restart (`docker compose up -d`); changing `API_URL` needs a rebuild because it is read at build time.

## Typecheck and lint

`npm run typecheck` currently passes. `npm run lint` reports two pre-existing findings:

- Error: `react-hooks/set-state-in-effect` in [`components/PropertyQA.tsx`](../components/PropertyQA.tsx). The first `useEffect` calls `setMessages(loadMessages(listingId))` to hydrate the chat from `sessionStorage` after mount, which the rule flags as setState inside an effect. The code is deliberate (the storage read must happen on the client after hydration) and is not a runtime bug, but the rule fails the lint run. Any fix (for example a lazy `useState` initialiser guarded for SSR, or `useSyncExternalStore`) is a separate change.
- Warning: `@typescript-eslint/no-unused-vars` for the `_next` parameter of the error handler in [`api/index.ts`](../api/index.ts). Express identifies error middleware by arity, so the fourth parameter has to exist even though it is unused.

## Tests

`npm test` runs the `node:test` suites in `tests/`. There are no test dependencies to install. Details and conventions are in [testing.md](testing.md).

## Adding a listing

See [data-model.md](data-model.md#adding-a-listing).
