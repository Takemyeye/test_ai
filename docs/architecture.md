# Architecture

The app is two processes that share one TypeScript codebase:

- A Next.js 16 frontend (App Router, React 19, Tailwind 4) that renders the listing pages and hosts the browser UI.
- An Express 5 API that owns the only server-side secret (the OpenRouter key) and exposes `POST /api/ask`.

Both import listing data and shared limits from [`lib/`](../lib). Nothing in the Next.js bundle imports from [`api/`](../api).

## Frontend

| Route | File | Rendering |
| --- | --- | --- |
| `/` | [`app/page.tsx`](../app/page.tsx) | Server component. Renders a hero and passes the full `listings` array to `ListingExplorer`. |
| `/listings/[id]` | [`app/listings/[id]/page.tsx`](../app/listings/[id]/page.tsx) | Server component. `generateStaticParams` pre-renders one page per listing id; an unknown id calls `notFound()`, which renders [`app/listings/[id]/not-found.tsx`](../app/listings/[id]/not-found.tsx). |

Client components:

- [`components/ListingExplorer.tsx`](../components/ListingExplorer.tsx): search, filters, sort and the result grid. All filtering happens in the browser against the array it received as a prop. See [search-and-filters.md](search-and-filters.md).
- [`components/PropertyQA.tsx`](../components/PropertyQA.tsx): the chat form on a listing page. Keeps the per-listing history in `sessionStorage` under the key `property-qa:<listingId>` and validates what it reads back before rendering it.

[`components/ListingCard.tsx`](../components/ListingCard.tsx) is a server-compatible presentational component used inside the explorer grid.

Listing illustrations are static SVG files in [`public/listings/`](../public/listings). Both the card and the detail page render them through `next/image` with the `unoptimized` prop, so Next serves the file as-is from `/public` instead of routing it through the image optimizer (which does not process SVG by default). The files are same-origin, which is what the CSP `img-src 'self'` directive allows.

## Backend

[`api/index.ts`](../api/index.ts) builds the Express app:

1. `app.disable("x-powered-by")`.
2. `GET /health` returns `{ "status": "ok" }`.
3. `POST /api/ask` runs `express.json({ limit: "4kb" })` and then [`handleAsk`](../api/src/routes/ask.ts).
4. A catch-all returns `404 { "error": "Not found." }` for any other method or path.
5. An error handler maps thrown errors with a 4xx/5xx `status` (for example the body parser's 400 and 413) to `{ "error": "Invalid request." }` and logs anything 500 or above.

The server binds to `API_HOST` (default `127.0.0.1`) on `API_PORT` (default `4000`). The file is run directly by Node 24 with no build step; `tsconfig.json` sets `erasableSyntaxOnly` so the TypeScript in `api/` and `lib/` stays within what Node's type stripping supports.

## Request flow for a question

1. The user submits the form in `PropertyQA`. The client trims the question, appends it to the chat and sends `POST /api/ask` with `{ listingId, question }` to the same origin it was served from (port 3000).
2. Next.js matches the rewrite in [`next.config.ts`](../next.config.ts) and proxies the request to `${API_URL}/api/ask` (default `http://localhost:4000`). The browser never talks to the API port directly.
3. `express.json` rejects non-JSON or oversized bodies (400 / 413) before the handler runs. Without a JSON content type the body is left undefined and fails validation later.
4. `handleAsk` checks the rate limit (429 with `Retry-After: 60`), rejects `sec-fetch-site: cross-site` (400), then calls [`parseAskRequest`](../api/src/utils/validation.ts) (400 on failure).
5. [`askAboutListing`](../api/src/addons/openrouter.ts) builds a system prompt plus a user message containing the listing JSON (without the `image` field) inside `<listing>` tags and the escaped question inside `<question>` tags, then calls OpenRouter with a 20 second timeout and `max_tokens: 400`.
6. The answer text is extracted defensively from the provider response and returned as `{ answer }`. Any provider failure becomes `502 { "error": "The assistant is unavailable right now." }`.
7. The client appends the answer (or the error text) as a plain-text bubble and writes the history to `sessionStorage`.

Full contract: [api.md](api.md).

## Why Express is separate

- The OpenRouter key is read from `process.env` only in `api/src/addons/openrouter.ts`. Keeping that file in a different process than the React tree makes it structurally impossible for the key to end up in a client bundle.
- The API is a small, dependency-light Node program that can be deployed, scaled and rate limited independently of the frontend, and it does not need Next's build pipeline.
- Outside Docker the API listens on `127.0.0.1` only, so the Next.js rewrite is the only way to reach it. In Compose it listens on `0.0.0.0` inside an internal network and does not publish a port.

## The rewrite in next.config.ts

```ts
async rewrites() {
  return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
}
```

`apiUrl` comes from `API_URL` at build time (the Dockerfile bakes in `http://api:4000`, the Compose service name). The rewrite means the browser only ever sees one origin, so there is no CORS configuration, and the rate limiter sees the `x-forwarded-for` header the client sent (Next passes it through unchanged and does not add its own; see Known limitations in the top-level [README](../README.md#known-limitations)).

## Security headers

`next.config.ts` attaches these headers to every response (`source: "/(.*)"`):

| Header | Value |
| --- | --- |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'` (+ `'unsafe-eval'` in dev) `; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'` (+ `ws://localhost:*` in dev) `; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |

`poweredByHeader: false` removes `X-Powered-By: Next.js`. The dev-only additions exist for React Fast Refresh (eval) and the HMR websocket. `output: "standalone"` produces the self-contained server used by the `web` Docker stage.

## File layout

| Path | Purpose |
| --- | --- |
| `app/layout.tsx` | Root layout: header, global CSS, metadata. |
| `app/page.tsx` | Home page: hero plus `ListingExplorer`. |
| `app/listings/[id]/page.tsx` | Listing detail page with illustration, facts, features and the Q&A chat. |
| `app/listings/[id]/not-found.tsx` | Rendered for unknown listing ids. |
| `app/globals.css` | Tailwind import and the chat animations (with a reduced-motion override). |
| `components/ListingExplorer.tsx` | Client component: search, filters, sort, result count, empty state. |
| `components/ListingCard.tsx` | Card in the results grid. |
| `components/PropertyQA.tsx` | Client component: chat UI and `sessionStorage` history. |
| `lib/listings.ts` | `Listing` and `PropertyType` types, `PROPERTY_TYPE_LABELS`, the 16 listings, `getListing`, `formatPrice`. |
| `lib/filterListings.ts` | Pure filter/sort logic shared by the explorer and the tests. |
| `lib/constants.ts` | `MAX_QUESTION_LENGTH = 500`, used by client and server. |
| `api/index.ts` | Express app: body parsing, routes, 404 and error handlers, `listen`. |
| `api/src/routes/ask.ts` | `POST /api/ask` handler: rate limit, cross-site check, validation, provider call. |
| `api/src/utils/validation.ts` | `parseAskRequest`: body shape, question normalisation and length, listing lookup. |
| `api/src/utils/rateLimit.ts` | `isRateLimited`: in-memory sliding window, per key and global. |
| `api/src/addons/openrouter.ts` | Prompt construction, OpenRouter call, answer extraction. |
| `public/listings/*.svg` | One illustration per listing, named by listing id. |
| `tests/*.test.ts` | `node:test` suites. See [testing.md](testing.md). |
| `scripts/run.mjs` | Starts frontend and API together for `npm run dev` and `npm start`. |
| `next.config.ts` | Standalone output, security headers, `/api` rewrite. |
| `Dockerfile`, `docker-compose.yml` | Multi-stage build with `web` and `api` targets; hardened Compose services. |
