# Prompt log

Tool: Claude Code (Claude Fable 5.1), used from the desktop app. Every file in this repository was produced through prompts; nothing was hand-written. Each AI output was reviewed before acceptance, and the security-related parts were additionally audited by a second AI agent. The entries below are the representative prompts, condensed, with what came out of each.

## 1. Brief and constraints

**Prompt:** Before writing code, give a short plan (file structure, order of work, risks) and wait for confirmation. Decisions already made: Next.js (App Router) + TypeScript frontend, a separate Node/Express backend, no database or external services, listings hardcoded in `lib/listings.ts`. AI feature: Property Q&A. Provider: OpenRouter via plain `fetch`, key in `OPENROUTER_API_KEY`, model in `AI_MODEL` with a sensible default, provide `.env.example`. Minimal Tailwind, single fluid layout.

Mandatory security requirements, to be built in from the start: the key is used only on the backend and never reaches the client; validate the body (`question` non-empty, at most 500 chars; `listingId` must exist; anything else is 400); listing data and the question go into the prompt as data with a system prompt that says so; render the answer as plain text only; generic error messages with correct status codes and details only in server logs; an in-memory rate limit. Deliverables at the end: README with a one-command run, real vs mocked, OWASP Top 10:2025 self-assessment; this prompt log; locked dependencies; `.gitignore` covering `.env*`. Keep it small, no libraries beyond Next, React, Tailwind, Express. Ask before widening scope.

**Result:** A plan with the file layout, the order of work (scaffold, data and pages, API, chat widget, browser verification, docs), default choices (`openai/gpt-4o-mini`, 20 s timeout, `max_tokens: 400`) and risks (in-memory limiter, prompt injection only mitigated, header trust model). Approved as-is.

## 2. Build

**Prompt:** Approved, go ahead.

**Result:**
- Scaffolded with `create-next-app` (Next 16, Tailwind v4, ESLint), removed template files and Google font imports.
- `lib/listings.ts` with ten realistic Seattle-area listings and helpers; index grid and listing detail page with `generateStaticParams` and a `not-found` page.
- Express backend in `api/`: `index.ts` (JSON body limit 4 KB, JSON 404 and error handlers, `x-powered-by` disabled, `/health`), `src/routes/ask.ts`, `src/utils/validation.ts`, `src/utils/rateLimit.ts`, `src/addons/openrouter.ts`. It runs TypeScript directly on Node 24 with `--env-file-if-exists=.env`. `next.config.ts` rewrites `/api/*` to `API_URL`; `scripts/run.mjs` starts both processes for `npm run dev` and `npm start`.
- Client `PropertyQA` component that renders the answer as a React text node.
- `.env.example`, `.gitignore` check, `package-lock.json` committed.
- Verified with `npm run build`, `npm run lint`, curl (real model answer, a prompt-injection attempt, the 400 cases, 429 on the 11th request), a grep confirming the key is absent from `.next/static`, and browser checks at mobile and desktop widths.

## 3. Docker

**Prompt:** Put the app into Docker containers for isolation.

**Result:** One multi-stage `Dockerfile` with `web` and `api` targets, `docker-compose.yml` with both services. Only `api` receives the key through `env_file`; only `web` publishes a port, bound to `127.0.0.1`. Both containers run non-root with a read-only filesystem, all capabilities dropped, `no-new-privileges`, memory and PID limits, and healthchecks. Verified that the container answers through the real model and that the key is absent from the `web` environment.

## 4. Security and bottleneck review by a second agent

**Prompt:** Run a separate agent that reviews the whole project read-only for security leaks (key exposure, error leakage, XSS, prompt injection, validation edge cases, rate-limit bypasses, Docker hardening) and bottlenecks (unbounded memory, missing timeouts, body size, cost abuse). Report file:line, severity, a failure scenario, and a concrete fix. Also list what is done correctly.

**Findings and what was done:**
- High: the rate limit keyed on a client-controlled `x-forwarded-for` was bypassable. Added a process-wide backstop of 60 requests per minute and switched to the last header hop with a socket-address fallback.
- High: the limiter map grew without bound. Added a sweep of expired keys once the map exceeds 10,000 entries and capped key length.
- Medium: no request body size cap. Added the 4 KB JSON limit and a `sec-fetch-site: cross-site` rejection.
- Low: `.gitignore` excluded `.env.example`; fixed with `!.env.example`.
- Low: Docker gaps; added memory and PID limits, healthchecks, and the loopback port binding.
- Low: the provider response parser rejected array-style `content`; now joins text parts.
- Deferred: pinning the base image by digest, documented as a limitation.

All fixes were re-verified: 70 requests with unique spoofed IPs hit 429 after the global limit, a 10 KB body returns 413, containers rebuilt and healthy.

## 5. Chat UI and home page

**Prompt:** Keep the AI answers on the page for demos and add a hero section. Is more than that overwork for a two-hour scope?

**Result:** Agreed to keep it to two cheap changes. `PropertyQA` became a chat: user and assistant bubbles, a typing indicator while waiting, a fade-and-rise animation for new messages (disabled under `prefers-reduced-motion`), Enter to send and Shift+Enter for a newline, and a Clear button. History is kept per listing in `sessionStorage` and validated on load; nothing is stored server-side. The home page got a short hero explaining the app. Rejected: server-side storage of answers, extra marketing sections, filters, and hardcoded demo answers.

## 6. OWASP verification pass

**Prompt:** Run every check behind the OWASP self-assessment against the live app and record the results.

**Result:** Each row of the assessment was exercised with curl or in the browser and logged in the README under "OWASP verification log": JSON 404 for wrong methods and paths, path-traversal-style ids rejected, `.env` ignored, no `x-powered-by`, key absent from the client bundle and the `web` container, `npm audit` clean, wrong types and `__proto__` keys handled safely, prompt-injection attempts declined, an assistant message containing `<img onerror>`, `<a>` and `<script>` rendered as literal text, per-client and global rate limits, 413 on oversized bodies, generic 502 with server-only logs when the provider fails or the key is missing. An OWASP ZAP baseline scan was run before and after adding security headers (`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, cross-origin policies, `poweredByHeader: false`); see the README for the final ZAP numbers.

## 7. Scenario testing by a QA agent

**Prompt:** Run a separate agent that tests the running app as a black box across scenario groups: happy path with answers checked against the listing data, an unanswerable question, non-English and unicode input, boundary lengths, every validation case, wrong methods and paths, security headers, pages, and the rate limit. Report a PASS/FAIL table, real bugs with exact request and response, and observations about answer quality.

**Result:** 30 scenarios, all passed, no bugs. Factual answers matched the listing data exactly (HOA amounts and coverage, pet rules, commute times, EV charger). The unanswerable question was declined rather than invented. A Russian question got a fluent Russian answer with the right facts. Injection attempts were refused and the model stayed on its own listing. Five minor observations were recorded; one of them, `X-Powered-By` on page responses, was fixed by `poweredByHeader: false`, and a `Retry-After` header was added to 429 responses. The rest (400 instead of 403 for cross-site, 404 instead of 405 for wrong methods, generic 413 message) were left as documented trade-offs.

## Representative prompts, verbatim

- "Before writing code, give a short plan (file structure, order of work, risks) and wait for my confirmation."
- "Security requirements are mandatory, build them in from the start, do not retrofit them later."
- "Run an agent that reviews the code and checks for bottlenecks and security leaks."
- "Is adding more sections overwork for this scope?" (answered: yes, keep it to the chat history and a hero)
- "Run every OWASP check and record the results."
- "Run an agent that tests the application with different scenarios."
