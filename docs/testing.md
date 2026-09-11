# Testing

The project has a unit test suite under [`tests/`](../tests) built on Node's built-in `node:test` runner and `node:assert/strict`. There is no test framework, transpiler or extra dependency: Node 24 executes the `.ts` files directly.

## Running

```bash
npm test
```

This runs `node --test "tests/**/*.test.ts"` (the glob is expanded by Node, not the shell). At the time of writing: 5 files, 10 suites, 60 tests, all passing in well under a second.

Useful variants:

```bash
node --test tests/validation.test.ts            # one file
node --test --test-name-pattern="maxPrice" "tests/**/*.test.ts"   # filter by test name
node --test --watch "tests/**/*.test.ts"        # re-run on change
```

`npm run typecheck` also covers `tests/` because `tsconfig.json` includes every `.ts` file in the repo.

## What is covered

| File | Module under test | Tests | What it checks |
| --- | --- | --- | --- |
| [`tests/filterListings.test.ts`](../tests/filterListings.test.ts) | `lib/filterListings.ts` | 28 | `normalizeQuery` trimming, lowercasing and whitespace collapsing. `filterListings`: defaults return everything sorted by price, input array is not mutated, each filter in isolation (type, exact and case-sensitive neighborhood, `minBeds` including studios at 0, inclusive `maxPrice`, `null` price), query matching against title, neighborhood, description and features, multi-word AND across fields, no-match result, AND combination of filters, all four sorts with the expected first listing. `uniqueNeighborhoods` dedupe and ordering. `countActiveFilters` for defaults, sort-only, whitespace query and each filter. |
| [`tests/listings.test.ts`](../tests/listings.test.ts) | `lib/listings.ts` | 11 | Dataset invariants: non-empty, ids unique and matching `^[a-z0-9-]+$`, non-empty title, description and features, positive price, baths and sqft, integer beds >= 0, plausible `yearBuilt`, every `type` has a label, `image` equals `/listings/<id>.svg`, and every image file exists in `public/`. `getListing` for known and unknown ids. `formatPrice` output and rounding. |
| [`tests/validation.test.ts`](../tests/validation.test.ts) | `api/src/utils/validation.ts` | 13 | `parseAskRequest`: valid body returns listing and trimmed question; rejects non-objects, missing fields, wrong types, unknown listing id, empty and whitespace-only questions, questions made only of invisible characters; strips invisible characters; applies NFKC (fullwidth letters become ASCII); accepts exactly 500 characters and rejects 501; measures length after trimming; ignores extra properties. |
| [`tests/rateLimit.test.ts`](../tests/rateLimit.test.ts) | `api/src/utils/rateLimit.ts` | 6 | `isRateLimited` with an injected `now`: exactly 10 requests pass and the 11th is blocked; blocked requests are not counted; keys are independent; the window slides and a request exactly 60 s old no longer counts; the global cap of 60 blocks a fresh key and frees up after the window. |
| [`tests/openrouter.test.ts`](../tests/openrouter.test.ts) | `api/src/addons/openrouter.ts` | 2 | `askAboutListing` rejects with `OpenRouterError` before making a request when `OPENROUTER_API_KEY` is unset (the key is removed in `beforeEach` and restored in `afterEach`); `OpenRouterError` is an `Error` subclass. |

Not covered: the Express route handler (`handleAsk`), the HTTP layer (status codes, 413, 404, `Retry-After`), prompt construction and answer extraction in `openrouter.ts` (both are module-private), and the React components. The README's verification log records the manual and black-box checks that were run against those.

## Conventions

- Files live directly in `tests/` and are named `<module>.test.ts`, one file per source module.
- Import from `node:test` (`describe`, `test`, `beforeEach`, `afterEach`) and `node:assert/strict`. Group with `describe`, name tests as plain sentences describing the behaviour.
- Import source modules by relative path with the `.ts` extension, for example `../lib/filterListings.ts` or `../api/src/utils/rateLimit.ts`. The `@/` path alias from `tsconfig.json` is a bundler feature and is not resolved by Node, so it cannot be used in tests. `allowImportingTsExtensions` in `tsconfig.json` makes the explicit extension type-check.
- Keep source and tests within Node's erasable TypeScript subset (no enums, no parameter properties, no namespaces); `erasableSyntaxOnly` enforces this at typecheck time.
- Modules with state are exercised without resetting it. `rateLimit.test.ts` avoids cross-test interference by giving every test a distinct key and a `now` that starts in 2030 and jumps a day per test, so windows never overlap. Follow the same approach rather than adding reset hooks to production code.
- Tests that need real listing data import `listings` from `lib/listings.ts`; tests about generic behaviour build fixtures with a small `buildListing(overrides)` helper so they do not break when the dataset changes.
- Tests that touch `process.env` save and restore the original value in `beforeEach` / `afterEach`.
- No network calls. The only provider test asserts the early exit before `fetch`.
- Use `import.meta.dirname` (available in Node 20.11+) to locate files relative to the test, as `listings.test.ts` does for `public/`.

## Adding a test file

1. Create `tests/<module>.test.ts`.
2. Start with:

   ```ts
   import { describe, test } from "node:test";
   import assert from "node:assert/strict";
   import { thing } from "../lib/thing.ts";

   describe("thing", () => {
     test("does what it says", () => {
       assert.equal(thing(1), 2);
     });
   });
   ```

3. Run `npm test`; the glob picks the file up automatically. Run `npm run typecheck` as well, since the test files are part of the TypeScript project.

For a pure function, call it directly. For code that reads the clock, prefer an injectable `now` parameter (as `isRateLimited` has) over mocking timers. For code that reads `process.env`, set and restore the variable around the test.
