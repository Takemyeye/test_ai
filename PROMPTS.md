# Prompt log and engineering notes

Tool: Claude Code (Claude Fable 5.1) in the desktop app. Every file in this repository was produced through prompts; nothing was written by hand. The human role was to read the brief, make the scoping decisions, write the prompts, review every AI output before accepting it, and direct separate AI agents to audit the result. This document records what was asked, why, and what came out, so a reviewer can follow the reasoning and not only the code.

## How the work was organised

The brief asks for a working AI feature, basic security, sensible scoping for about two hours, and a clearly AI-driven workflow. Those four goals shaped the process:

- **Plan before code.** The first prompt asked for a plan and explicitly forbade writing code until the plan was confirmed. This is where scope was cut.
- **Security in the first prompt, not as a retrofit.** The OWASP requirements from the brief were translated into concrete constraints (key only on the backend, validation rules, plain-text rendering, generic errors, rate limit) and handed to the AI up front.
- **One main agent builds, separate agents audit.** The agent that wrote the code was not trusted to grade its own work. A read-only review agent looked for security leaks and bottlenecks, and a black-box QA agent tested the running app without seeing the source. Their findings went back to the main agent as fix prompts.
- **Every claim is verified against the running app.** Each row of the OWASP self-assessment in the README was exercised with curl, in the browser, or with OWASP ZAP, and the results were logged.
- **Side tasks were kept cheap and reversible.** Docker, the chat UI, and the hero section were each a single short prompt with an explicit question about whether they were worth the time.

## 0. Reading the brief: decisions before the first prompt

| Brief requirement | Decision | Reasoning |
| --- | --- | --- |
| At least one real AI feature | Property Q&A | Of the three options it has the most interesting security surface: untrusted user text and trusted listing data enter the same prompt. It also demonstrates grounding (answering only from data) rather than free generation. |
| Everything else can be mocked | Ten hardcoded listings in `lib/listings.ts`, no DB, no auth, no images | Keeps the trust boundary to one server route and one static data set. |
| Your choice of stack, single run command, locked deps | Next.js App Router + TypeScript, separate Express backend, `npm run dev` starts both, `package-lock.json` committed | A separate backend makes "the key never reaches the browser" a structural fact rather than a discipline. Next.js gives the responsive pages and a rewrite that hides the backend port. |
| Any LLM provider | OpenRouter via plain `fetch`, model in `AI_MODEL` | One HTTP call, no SDK dependency, and the model can be swapped by env var without a code change. See the model research below. |
| Responsive | One fluid Tailwind layout, checked at 375 px and desktop | The brief says a single fluid layout is fine and visual polish is not judged. |
| About two hours | No tests, no auth, no persistence, no streaming, no markdown rendering | Each of these was considered and cut. Markdown rendering was rejected specifically because plain text is the safest output path. |

## 1. Model research on OpenRouter

The default model had to be cheap enough that a public, unauthenticated endpoint cannot run up a bill, good at following a "treat this as data" instruction, and able to answer in the user's language. Candidates were compared on OpenRouter's public model list (prices re-checked on 2026-09-11, USD per million tokens):

| Model | Input | Output | Note |
| --- | --- | --- | --- |
| `openai/gpt-4o-mini` | 0.15 | 0.60 | **Chosen default.** Reliable instruction following, refused every injection attempt in testing, fluent Russian answer. |
| `openai/gpt-4.1-nano` | 0.10 | 0.40 | Cheaper, weaker at nuanced refusals; a reasonable fallback. |
| `openai/gpt-4.1-mini` | 0.40 | 1.60 | Better quality than needed for a Q&A over a 300-token listing. |
| `google/gemini-2.5-flash-lite` | 0.10 | 0.40 | Comparable price, less tested for this prompt shape. |
| `anthropic/claude-haiku-4.5` | 1.00 | 5.00 | Strongest at refusing injection, but roughly eight times the cost. |
| `meta-llama/llama-3.3-70b-instruct` | 0.10 | 0.32 | Open weights, cheap, but slower and less consistent with tags-as-data. |

With `max_tokens: 400` and a listing of a few hundred tokens, one answer costs well under a tenth of a cent on the default model, so the per-minute limits, not the model price, are the real spend control. The choice is a default, not a lock-in: `AI_MODEL=anthropic/claude-haiku-4.5` in `.env` switches it.

## 2. Plan first

**Prompt:** Before writing code, give a short plan (file structure, order of work, risks) and wait for my confirmation. Decisions already made: Next.js (App Router) + TypeScript frontend, a separate Node/Express backend, no database or external services, listings hardcoded in `lib/listings.ts`. AI feature: Property Q&A. Provider: OpenRouter via plain `fetch`, key in `OPENROUTER_API_KEY`, model in `AI_MODEL` with a sensible default, provide `.env.example`. Minimal Tailwind, single fluid layout.

Security requirements are mandatory, build them in from the start, do not retrofit them later: the key is used only on the backend and never reaches the client; validate the body (`question` non-empty, at most 500 chars; `listingId` must exist; anything else is 400); listing data and the question go into the prompt as data with a system prompt that says so; render the answer as plain text only; generic error messages with correct status codes and details only in server logs; an in-memory rate limit. Deliverables: README with a one-command run, real vs mocked, OWASP Top 10:2025 self-assessment; this prompt log; locked dependencies; `.gitignore` covering `.env*`. Keep it small, no libraries beyond Next, React, Tailwind, Express. Ask before widening scope.

**Result:** A plan with the file layout, the order of work (scaffold, data and pages, API, chat widget, browser verification, docs), default choices (`openai/gpt-4o-mini`, 20 s timeout, `max_tokens: 400`) and named risks: the in-memory limiter resets on restart, prompt injection can only be mitigated, and the `x-forwarded-for` trust model depends on a proxy in front. Approved as-is.

## 3. Build

**Prompt:** Approved, go ahead.

**Result:**
- Scaffolded with `create-next-app` (Next 16, Tailwind v4, ESLint); template files and Google font imports removed.
- `lib/listings.ts` with ten realistic Seattle-area listings and helpers; index grid and listing detail page with `generateStaticParams` and a `not-found` page.
- Express backend in `api/`: `index.ts` (JSON body limit 4 KB, JSON 404 and error handlers, `x-powered-by` disabled, `/health`), `src/routes/ask.ts`, `src/utils/validation.ts`, `src/utils/rateLimit.ts`, `src/addons/openrouter.ts`. Runs TypeScript directly on Node 24 with `--env-file-if-exists=.env`. `next.config.ts` rewrites `/api/*` to `API_URL`; `scripts/run.mjs` starts both processes for `npm run dev` and `npm start`.
- Client `PropertyQA` component that renders the answer as a React text node.
- `.env.example`, `.gitignore` check, `package-lock.json` committed.

**Review before acceptance:** `npm run build` and `npm run lint`; curl with a real model answer, a prompt-injection attempt, every 400 case, and 429 on the 11th request; a grep confirming the key is absent from `.next/static`; browser checks at mobile and desktop widths.

## 4. Side task: Docker

**Prompt:** Put the app into Docker containers for isolation.

**Result:** One multi-stage `Dockerfile` with `web` and `api` targets, `docker-compose.yml` with both services. Only `api` receives the key through `env_file`; only `web` publishes a port, bound to `127.0.0.1`. Both containers run non-root with a read-only filesystem, all capabilities dropped, `no-new-privileges`, memory and PID limits, and healthchecks. Verified that the container answers through the real model and that the key is absent from the `web` environment.

## 5. Security and bottleneck review by a second agent (round 1)

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

## 6. Side task: chat UI and home page, with a scope check

**Prompt:** Keep the AI answers on the page for demos and add a hero section. Is more than that overwork for a two-hour scope?

**Result:** Agreed to keep it to two cheap changes. `PropertyQA` became a chat: user and assistant bubbles, a typing indicator, a fade-and-rise animation for new messages (disabled under `prefers-reduced-motion`), Enter to send and Shift+Enter for a newline, and a Clear button. History is kept per listing in `sessionStorage` and validated on load; nothing is stored server-side. The home page got a short hero explaining the app. Rejected as overwork: server-side storage of answers, extra marketing sections, filters, and hardcoded demo answers.

## 7. OWASP verification pass

**Prompt:** Run every check behind the OWASP self-assessment against the live app and record the results.

**Result:** Each row of the assessment was exercised and logged in the README under "OWASP verification log": JSON 404 for wrong methods and paths, path-traversal-style ids rejected, `.env` ignored, no `x-powered-by`, key absent from the client bundle and the `web` container, `npm audit` clean, wrong types and `__proto__` keys handled safely, prompt-injection attempts declined, an assistant message containing `<img onerror>`, `<a>` and `<script>` rendered as literal text, per-client and global rate limits, 413 on oversized bodies, generic 502 with server-only logs when the provider fails or the key is missing. An OWASP ZAP baseline scan was run before and after adding security headers (`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, cross-origin policies, `poweredByHeader: false`): 0 FAIL, 6 WARN, 61 PASS after the change, the remaining warnings being dev-mode artifacts.

## 8. Black-box scenario testing by a QA agent (round 1)

**Prompt:** Run a separate agent that tests the running app as a black box across scenario groups: happy path with answers checked against the listing data, an unanswerable question, non-English and unicode input, boundary lengths, every validation case, wrong methods and paths, security headers, pages, and the rate limit. Report a PASS/FAIL table, real bugs with exact request and response, and observations about answer quality.

**Result:** 30 scenarios, all passed, no bugs. Factual answers matched the listing data exactly (HOA amounts and coverage, pet rules, commute times, EV charger). The unanswerable question was declined rather than invented. A Russian question got a fluent Russian answer with the right facts. Injection attempts were refused and the model stayed on its own listing. Five minor observations were recorded; `X-Powered-By` on page responses was fixed with `poweredByHeader: false`, and a `Retry-After` header was added to 429 responses. The rest (400 instead of 403 for cross-site, 404 instead of 405 for wrong methods, generic 413 message) were left as documented trade-offs.

## 9. Second full audit cycle (2026-09-11)

**Prompt:** Re-run the review agent, the QA agent, and the OWASP checks against the current code and report.

**Review agent, round 2.** 2 High, 6 Medium, 8 Low. The two High findings were the already-documented `x-forwarded-for` trust model and its consequence that the global limit becomes a denial-of-service lever; both are accepted for a deployment behind a trusted proxy and stay in the README's limitations. Three findings were cheap enough to fix on the spot:
- Medium: the question was inserted raw between `<question>` tags, so a question containing `</question></listing>` could close the data envelope. Fix: `<` in the question is escaped before it enters the prompt. Verified: the breakout payload now produces "The listing does not contain any question to answer" instead of following the injected instruction.
- Medium: invisible Unicode (zero-width spaces, BOM, bidi controls) passed the empty-question check and could hide payloads in logs. Fix: the question is NFKC-normalised and format and control characters other than newline are stripped before validation. Verified: a zero-width-only question returns 400; a real question wrapped in bidi and zero-width characters is answered normally; multi-line questions still work.
- Medium: the API bound to all interfaces when run outside Docker, so anyone on the LAN could bypass the Next rewrite. Fix: it binds to `127.0.0.1` unless `API_HOST` is set; Compose sets `API_HOST=0.0.0.0` inside the container network. Verified with `lsof` locally and a rebuilt container answering through the published port.
Recorded as trade-offs rather than fixed: nonce-based CSP instead of `unsafe-inline`, HSTS (belongs on the TLS-terminating proxy), a daily spend ceiling beyond the per-minute limits (set on the OpenRouter key itself), server-level request timeouts, a size cap on the provider response body, a separate `package.json` for the API image, `npm ci --ignore-scripts`, Docker secrets instead of `env_file`, and pinning base images by digest. The agent's "done correctly" list confirmed the key handling, error handling, XSS posture, validation, limiter bounds, and container hardening.

**QA agent, round 2.** 40 scenarios across the same groups, all passed, no application bugs, 9 real model calls. New checks this round: case-variant listing id rejected, `Origin` header alone not trusted, the exact order of checks documented (body size, JSON parse, rate limit, field validation), and the global limit observed at the 57th request because a few earlier requests were still inside the window. Answer quality: every factual answer grounded in the listing, the unanswerable question named both missing facts, correct inference ("two dogs around 40 pounds" against "up to two pets under 50 pounds"), Russian answer correct with one awkward phrase. The one outage the agent saw was caused by the operator restarting the API for a parallel test, not by the app.

**OWASP checks.** `npm audit` 0 vulnerabilities; the key absent from `.next/static`; `.env` git-ignored; all security headers present on pages; JSON 404 with no `x-powered-by` on the API; provider failure paths return a generic 502 with the real cause (`OpenRouter responded with status 400`, `OPENROUTER_API_KEY is not set`) only in server logs; ZAP baseline again 0 FAIL, 6 WARN, 61 PASS; mobile layout re-checked at 375 px.

**Observation left open:** `npm run lint` reports one pre-existing error in `components/PropertyQA.tsx` (a `setState` call inside the effect that restores `sessionStorage` history) and one unused-parameter warning in the Express error handler. Neither affects behaviour; the effect should move the restore into a lazy `useState` initialiser.

## Who did what

| Role | What it did | What it was not allowed to do |
| --- | --- | --- |
| Human | Read the brief, chose the feature, stack and provider, wrote every prompt, reviewed every diff, decided which findings to fix and which to document | Write code by hand |
| Main agent | Plan, scaffold, implement, apply fixes, update docs | Widen scope without asking, add dependencies |
| Review agent | Read-only audit of the source for leaks and bottlenecks, with file:line and a failure scenario per finding | Modify files |
| QA agent | Black-box tests against the running app with curl, PASS/FAIL table, answer-quality notes | Read the source before testing, modify files |
| OWASP ZAP | Passive baseline scan of the running frontend, before and after the header change | — |

## Representative prompts, verbatim

- "Before writing code, give a short plan (file structure, order of work, risks) and wait for my confirmation."
- "Security requirements are mandatory, build them in from the start, do not retrofit them later."
- "Run an agent that reviews the code and checks for bottlenecks and security leaks."
- "Is adding more sections overwork for this scope?" (answered: yes, keep it to the chat history and a hero)
- "Run every OWASP check and record the results."
- "Run an agent that tests the application with different scenarios."
- "Re-run the review agent, the QA agent, and the OWASP checks against the current code and report."

## What I would improve with more time

Move rate limiting and a daily spend budget out of process memory into Redis or the platform's edge, so they survive restarts and replicas. Replace `unsafe-inline` in the CSP with a per-request nonce. Add a lightweight second pass that checks the model's answer only references facts present in the listing. Add unit tests for `parseAskRequest` and `isRateLimited` and a mocked route test.
