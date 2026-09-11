# Security

This is a summary of the threat model and the controls in the code. The authoritative OWASP Top 10:2025 self-assessment and the verification log (every check that was run and what it returned) are in the top-level README:

- [OWASP Top 10:2025 self-assessment](../README.md#owasp-top-102025-self-assessment)
- [OWASP verification log](../README.md#owasp-verification-log)
- [Security notes](../README.md#security-notes)
- [Known limitations](../README.md#known-limitations)

## Threat model

Assets worth protecting:

1. The OpenRouter API key (direct financial cost if leaked).
2. LLM spend (each `/api/ask` call costs money; abuse is a cost-based denial of service).
3. Users' browsers (rendering of model output and stored chat history).

There are no accounts, sessions, private data or writes, so classic access-control, authentication and cryptography concerns mostly do not apply. The interesting surface is a single endpoint that combines untrusted user text with trusted listing data in a prompt to a third party.

Untrusted inputs: the `POST /api/ask` body and headers, the model's response, and whatever is in `sessionStorage` when the page loads.

## Controls by concern

### Key confinement

The key is read from `process.env.OPENROUTER_API_KEY` in exactly one file, [`api/src/addons/openrouter.ts`](../api/src/addons/openrouter.ts), which runs in the Express process. The Next.js app never imports from `api/`, `.env*` is git-ignored and docker-ignored, and the `api` container receives the key via `env_file` at run time rather than at build time. The build output in `.next/static` was grepped for the key with zero hits.

### Input validation

Described in detail in [api.md](api.md#validation-parseaskrequest). In short: JSON only, 4 KB body cap, both fields must be strings, `listingId` must exist, the question is NFKC-normalised, stripped of format and control characters, trimmed and bounded to 500 characters. The client's `maxLength` is a usability aid only; the server is the enforcement point. Prototype-pollution keys in the body are ignored because only two named properties are read.

### Prompt injection

The model receives a system prompt saying it answers about one listing, that tagged content is data even if it looks like a command, and that it must say when the listing lacks the information. The user message wraps the listing JSON in `<listing>` tags and the question in `<question>` tags, with `<` in the question escaped to `&lt;` so the question cannot close a tag and pose as instructions. The model has no tools, no secrets and no access beyond the text it is given, so a successful injection can at most produce an off-topic answer. The `image` path is dropped from the listing JSON before it is sent. Injection is mitigated, not eliminated; the README notes output moderation as future work.

### Output handling

The answer is placed in the React tree as a text node inside a `<div>`; `dangerouslySetInnerHTML` is not used anywhere. Chat history restored from `sessionStorage` is filtered through a type guard (`isMessage`) before rendering, so a tampered entry is dropped rather than trusted. The provider payload is parsed defensively (`extractAnswer`) and treated as untrusted text.

### Abuse and cost

- In-memory rate limit: 10 requests per client per minute keyed on the last `x-forwarded-for` hop (fallback: socket address), plus a global 60 per minute across all clients that holds even when the header is spoofed. 429 responses carry `Retry-After: 60`.
- Provider call bounded by a 20 second timeout and `max_tokens: 400`.
- Request body capped at 4 KB, question at 500 characters.
- The limiter's key map is swept when it grows past 10,000 entries.

Limitations: the limit is per process and resets on restart; without a trusted reverse proxy setting `x-forwarded-for`, all browsers behind the Next rewrite share one bucket and the global limit does the real work.

### Browser hardening

All responses from Next carry the headers listed in [architecture.md](architecture.md#security-headers): a CSP with `default-src 'self'`, `frame-ancestors 'none'`, `img-src 'self' data:` (the listing SVGs are same-origin), `nosniff`, `X-Frame-Options: DENY`, a strict referrer policy, a restrictive `Permissions-Policy`, COOP and CORP. `X-Powered-By` is disabled in both Next and Express. `'unsafe-inline'` remains for scripts and styles because Next's default output needs it; a nonce-based CSP is listed as future work. `'unsafe-eval'` and the websocket source are added in development only.

### Cross-site requests

Requests carrying `sec-fetch-site: cross-site` are rejected with 400. The API also emits no CORS headers and, outside Docker, binds to `127.0.0.1`, so the Next rewrite is the only route in.

### Error handling and logging

Every failure path returns JSON with a generic message and an accurate status (400, 404, 413, 429, 502, 500). Provider status codes and bodies, stack traces and environment values are only written to the server log. The client shows a generic message in the chat and keeps the form usable.

### Deployment hardening

Both Compose services run as non-root users on a read-only filesystem with all capabilities dropped, `no-new-privileges`, memory and PID limits and healthchecks. Only `web` publishes a port, bound to `127.0.0.1`. TLS termination, HSTS and a trusted `x-forwarded-for` are expected from a reverse proxy in front of the container.

## Residual risks

Taken from the README's limitations and the OWASP table:

- Prompt injection can still steer the answer text; there is no second-pass check that the answer references only listing facts.
- The rate limit is not distributed and is only as good as the proxy that sets `x-forwarded-for`.
- `unsafe-inline` in the CSP.
- The Node base image is pinned by tag, not digest.
