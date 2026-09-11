# Documentation

Project documentation for the Property Listing Assistant. The top-level [README](../README.md) is the overview and the OWASP self-assessment; the files here go into detail on each part of the system.

| Document | Contents |
| --- | --- |
| [architecture.md](architecture.md) | Frontend/backend split, request flow for a question, the Next.js rewrite, security headers, file layout. |
| [data-model.md](data-model.md) | The `Listing` type field by field, property types, where the data lives, how to add a listing, what the LLM sees. |
| [search-and-filters.md](search-and-filters.md) | How the home page search, filters and sort work, query matching rules, extension points. |
| [api.md](api.md) | The `POST /api/ask` contract: body, validation, status codes, rate limit, error shapes, curl examples, `GET /health`. |
| [security.md](security.md) | Threat model and mitigations in summary form, with links to the OWASP table in the top-level README. |
| [development.md](development.md) | Prerequisites, environment variables, dev/build/start, Docker, typecheck, lint, tests, known issues. |
| [testing.md](testing.md) | What the test suite covers, how to run it, how to add a test, conventions. |
