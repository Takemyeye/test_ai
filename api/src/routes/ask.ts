import type { Request, Response } from "express";
import { askAboutListing } from "../addons/openrouter.ts";
import { isRateLimited } from "../utils/rateLimit.ts";
import { parseAskRequest } from "../utils/validation.ts";

const MAX_CLIENT_KEY_LENGTH = 64;

function clientKey(request: Request): string {
  const forwardedFor = request.header("x-forwarded-for") ?? "";
  const lastHop = forwardedFor.split(",").at(-1)?.trim();
  return (lastHop || request.socket.remoteAddress || "unknown").slice(0, MAX_CLIENT_KEY_LENGTH);
}

export async function handleAsk(request: Request, response: Response): Promise<void> {
  if (isRateLimited(clientKey(request))) {
    response.set("Retry-After", "60").status(429).json({ error: "Too many requests. Please try again in a minute." });
    return;
  }

  if (request.header("sec-fetch-site") === "cross-site") {
    response.status(400).json({ error: "Invalid request." });
    return;
  }

  const parsed = parseAskRequest(request.body);
  if (!parsed) {
    response.status(400).json({ error: "Invalid request." });
    return;
  }

  try {
    const answer = await askAboutListing(parsed.listing, parsed.question);
    response.json({ answer });
  } catch (error) {
    console.error("[api/ask] failed to get an answer", error);
    response.status(502).json({ error: "The assistant is unavailable right now." });
  }
}
