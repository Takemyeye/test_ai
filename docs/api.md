# API

The Express server in [`api/index.ts`](../api/index.ts) exposes two endpoints. In development and production the browser reaches `/api/*` through the Next.js rewrite on port 3000; the examples below use that port. Hitting port 4000 directly only works from the same machine (the API binds to `127.0.0.1` outside Docker).

## `POST /api/ask`

Handler: [`api/src/routes/ask.ts`](../api/src/routes/ask.ts).

### Request

```
POST /api/ask
Content-Type: application/json

{ "listingId": "harbor-loft", "question": "How high are the ceilings?" }
```

| Field | Type | Rule |
| --- | --- | --- |
| `listingId` | string | Must equal the `id` of a listing in `lib/listings.ts`. |
| `question` | string | After NFKC normalisation, removal of invisible characters and trimming: 1 to 500 characters (`MAX_QUESTION_LENGTH` in `lib/constants.ts`). |

Extra properties are ignored. The body must be a JSON object of at most 4 KB.

### Validation ([`parseAskRequest`](../api/src/utils/validation.ts))

1. Body must be a non-null object (a missing or non-JSON content type leaves `req.body` undefined, which fails here).
2. `listingId` and `question` must both be strings.
3. `question` is normalised with `String.prototype.normalize("NFKC")`, then every Unicode format character (`\p{Cf}`: zero-width spaces and joiners, BOM, soft hyphen, bidi controls) and every C0/C1 control character except tab is removed, then it is trimmed.
4. The result must have length 1 to 500 inclusive. The limit is measured after cleaning, so leading and trailing whitespace does not count.
5. `getListing(listingId)` must return a listing.

The cleaned question, not the original, is what reaches the model.

### Processing order

Checks run in this sequence; the first failure decides the response.

| Step | Where | Failure response |
| --- | --- | --- |
| Body parsing (`express.json({ limit: "4kb" })`) | `api/index.ts` | 400 for malformed JSON, 413 for a body over 4 KB, both with `{ "error": "Invalid request." }` from the error handler |
| Rate limit | `handleAsk` | 429 |
| `sec-fetch-site: cross-site` header present | `handleAsk` | 400 |
| `parseAskRequest` | `handleAsk` | 400 |
| Provider call | `askAboutListing` | 502 |

Because the rate limiter runs before validation, requests that fail validation still consume rate-limit budget. Requests rejected by the limiter itself do not.

### Success response

```
200 OK
Content-Type: application/json

{ "answer": "The loft has 14-foot ceilings." }
```

`answer` is plain text (the system prompt asks for no markdown), trimmed, non-empty.

### Status codes

| Status | Body | When |
| --- | --- | --- |
| 200 | `{ "answer": string }` | Valid request and the provider returned text. |
| 400 | `{ "error": "Invalid request." }` | Malformed JSON, non-object body, wrong field types, unknown `listingId`, empty or over-long question, missing JSON content type, or `sec-fetch-site: cross-site`. |
| 404 | `{ "error": "Not found." }` | Any other method on `/api/ask` (for example GET) or any unknown path. There is no 405. |
| 413 | `{ "error": "Invalid request." }` | Request body larger than 4 KB. |
| 429 | `{ "error": "Too many requests. Please try again in a minute." }` | Rate limit hit. Includes `Retry-After: 60`. |
| 502 | `{ "error": "The assistant is unavailable right now." }` | `OPENROUTER_API_KEY` unset, provider returned a non-2xx status, the 20 second timeout fired, or the response had no usable text. Details are logged on the server only. |
| 500 | `{ "error": "Invalid request." }` | Unexpected error without a status reaching the generic error handler. Logged as `[server] unhandled error`. |

All error bodies have the shape `{ "error": string }` with a fixed, generic message. Provider status codes, response bodies and stack traces never appear in responses.

### Rate limit ([`isRateLimited`](../api/src/utils/rateLimit.ts))

- Sliding window of 60 seconds, kept in process memory.
- Per-client limit: 10 requests per window. The client key is the last comma-separated hop of `x-forwarded-for`, trimmed, or `req.socket.remoteAddress` if the header is absent, truncated to 64 characters.
- Global limit: 60 requests per window across all clients. This bounds LLM spend even when the header is spoofed with unique values.
- A blocked request is not recorded, so a client that keeps retrying is admitted again as soon as its oldest counted request leaves the window.
- When the map of tracked keys reaches 10,000 entries, keys with no timestamps in the current window are swept.
- The 429 response carries `Retry-After: 60` (seconds). This is a fixed value, not the exact time until the window frees up.
- Limits reset when the process restarts and are not shared between instances.

### Cross-site check

If the request carries `sec-fetch-site: cross-site`, the handler answers 400 before validation. Browsers set this header automatically on fetches from another origin; same-origin requests through the Next.js rewrite carry `same-origin`. Requests without the header (curl, older clients) are not affected. This is a defence-in-depth measure; the API is not reachable cross-origin anyway because it has no CORS headers and binds to localhost.

### curl examples

Successful question:

```bash
curl -s http://localhost:3000/api/ask \
  -H 'Content-Type: application/json' \
  -d '{"listingId":"harbor-loft","question":"What does the HOA cover?"}'
```

Unknown listing (400):

```bash
curl -s -i http://localhost:3000/api/ask \
  -H 'Content-Type: application/json' \
  -d '{"listingId":"nope","question":"Hello?"}'
```

Question over 500 characters (400):

```bash
curl -s -i http://localhost:3000/api/ask \
  -H 'Content-Type: application/json' \
  -d "{\"listingId\":\"harbor-loft\",\"question\":\"$(printf 'a%.0s' $(seq 501))\"}"
```

Body over 4 KB (413):

```bash
curl -s -i http://localhost:3000/api/ask \
  -H 'Content-Type: application/json' \
  -d "{\"listingId\":\"harbor-loft\",\"question\":\"$(head -c 5000 /dev/zero | tr '\0' a)\"}"
```

Malformed JSON (400):

```bash
curl -s -i http://localhost:3000/api/ask -H 'Content-Type: application/json' -d '{broken'
```

Cross-site marker (400):

```bash
curl -s -i http://localhost:3000/api/ask \
  -H 'Content-Type: application/json' -H 'sec-fetch-site: cross-site' \
  -d '{"listingId":"harbor-loft","question":"Hello?"}'
```

Rate limit (the 11th call within a minute returns 429 with `Retry-After: 60`):

```bash
for i in $(seq 11); do
  curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/ask \
    -H 'Content-Type: application/json' \
    -d '{"listingId":"harbor-loft","question":"Hello?"}'
done
```

Wrong method (404):

```bash
curl -s -i http://localhost:3000/api/ask
```

## `GET /health`

Returns `200 { "status": "ok" }` whenever the Express process is up. It does not check the OpenRouter key or connectivity. It is not under `/api/`, so the Next.js rewrite does not expose it on port 3000; the Compose `api` service healthcheck calls it directly at `http://127.0.0.1:4000/health`, and `web` waits for that check before starting.

```bash
curl -s http://localhost:4000/health
```
