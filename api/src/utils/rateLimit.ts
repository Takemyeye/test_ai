const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_KEY = 10;
const MAX_REQUESTS_GLOBAL = 60;
const MAX_TRACKED_KEYS = 10_000;
const GLOBAL_KEY = "*";

const requestTimestampsByKey = new Map<string, number[]>();

function recentTimestamps(key: string, now: number): number[] {
  const windowStart = now - WINDOW_MS;
  return (requestTimestampsByKey.get(key) ?? []).filter((timestamp) => timestamp > windowStart);
}

function sweepExpired(now: number): void {
  const windowStart = now - WINDOW_MS;
  for (const [key, timestamps] of requestTimestampsByKey) {
    if (timestamps.every((timestamp) => timestamp <= windowStart)) requestTimestampsByKey.delete(key);
  }
}

export function isRateLimited(key: string, now = Date.now()): boolean {
  if (requestTimestampsByKey.size >= MAX_TRACKED_KEYS) sweepExpired(now);

  const global = recentTimestamps(GLOBAL_KEY, now);
  if (global.length >= MAX_REQUESTS_GLOBAL) return true;

  const perKey = recentTimestamps(key, now);
  if (perKey.length >= MAX_REQUESTS_PER_KEY) {
    requestTimestampsByKey.set(key, perKey);
    return true;
  }

  global.push(now);
  perKey.push(now);
  requestTimestampsByKey.set(GLOBAL_KEY, global);
  requestTimestampsByKey.set(key, perKey);
  return false;
}
