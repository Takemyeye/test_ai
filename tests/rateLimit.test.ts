import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { isRateLimited } from "../api/src/utils/rateLimit.ts";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_KEY = 10;
const MAX_REQUESTS_GLOBAL = 60;
const ISOLATION_GAP_MS = 24 * 60 * 60 * 1000;

let nextIsolatedWindowStart = Date.UTC(2030, 0, 1);

function isolatedWindowStart(): number {
  const start = nextIsolatedWindowStart;
  nextIsolatedWindowStart += ISOLATION_GAP_MS;
  return start;
}

function exhaustKey(key: string, now: number): void {
  for (let i = 0; i < MAX_REQUESTS_PER_KEY; i++) {
    assert.equal(isRateLimited(key, now + i), false, `request ${i + 1} for ${key} should pass`);
  }
}

describe("isRateLimited", () => {
  test("allows exactly the per-key limit and blocks the next request", () => {
    const now = isolatedWindowStart();
    const key = "boundary";
    exhaustKey(key, now);
    assert.equal(isRateLimited(key, now + MAX_REQUESTS_PER_KEY), true);
    assert.equal(isRateLimited(key, now + MAX_REQUESTS_PER_KEY + 1), true);
  });

  test("blocked requests do not count toward the window", () => {
    const now = isolatedWindowStart();
    const key = "blocked-not-counted";
    exhaustKey(key, now);
    assert.equal(isRateLimited(key, now + 100), true);
    assert.equal(isRateLimited(key, now + WINDOW_MS), false);
  });

  test("keys are tracked independently", () => {
    const now = isolatedWindowStart();
    exhaustKey("tenant-a", now);
    assert.equal(isRateLimited("tenant-a", now + 50), true);
    assert.equal(isRateLimited("tenant-b", now + 50), false);
  });

  test("the window slides: requests older than the window free up capacity", () => {
    const now = isolatedWindowStart();
    const key = "sliding";
    exhaustKey(key, now);
    assert.equal(isRateLimited(key, now + WINDOW_MS - 1), true);
    assert.equal(isRateLimited(key, now + WINDOW_MS), false);
    assert.equal(isRateLimited(key, now + WINDOW_MS), true);
  });

  test("a request exactly one window old no longer counts", () => {
    const now = isolatedWindowStart();
    const key = "edge";
    exhaustKey(key, now);
    assert.equal(isRateLimited(key, now + WINDOW_MS - 1), true);
    assert.equal(isRateLimited(key, now + WINDOW_MS), false);
  });

  test("global limit blocks a fresh key once total requests hit the cap", () => {
    const now = isolatedWindowStart();
    const keysNeeded = MAX_REQUESTS_GLOBAL / MAX_REQUESTS_PER_KEY;
    for (let k = 0; k < keysNeeded; k++) exhaustKey(`global-${k}`, now);
    assert.equal(isRateLimited("global-fresh", now + 1), true);
    assert.equal(isRateLimited("global-fresh", now + WINDOW_MS + 1), false);
  });
});
