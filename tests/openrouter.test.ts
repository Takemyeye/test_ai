import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { OpenRouterError, askAboutListing } from "../api/src/addons/openrouter.ts";
import { listings } from "../lib/listings.ts";

describe("askAboutListing", () => {
  let savedApiKey: string | undefined;

  beforeEach(() => {
    savedApiKey = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  afterEach(() => {
    if (savedApiKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = savedApiKey;
  });

  test("rejects with OpenRouterError before any request when the API key is missing", async () => {
    await assert.rejects(askAboutListing(listings[0], "Is there parking?"), OpenRouterError);
  });

  test("OpenRouterError is a distinguishable Error subclass", () => {
    const error = new OpenRouterError("boom");
    assert.ok(error instanceof Error);
    assert.equal(error.message, "boom");
  });
});
