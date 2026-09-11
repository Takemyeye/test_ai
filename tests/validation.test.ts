import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseAskRequest } from "../api/src/utils/validation.ts";
import { MAX_QUESTION_LENGTH } from "../lib/constants.ts";

const KNOWN_ID = "harbor-loft";

describe("parseAskRequest", () => {
  test("valid body returns the listing and the trimmed question", () => {
    const result = parseAskRequest({ listingId: KNOWN_ID, question: "  How high are the ceilings?  " });
    assert.ok(result);
    assert.equal(result.listing.id, KNOWN_ID);
    assert.equal(result.question, "How high are the ceilings?");
  });

  test("rejects non-object bodies", () => {
    assert.equal(parseAskRequest(null), null);
    assert.equal(parseAskRequest(undefined), null);
    assert.equal(parseAskRequest("string"), null);
    assert.equal(parseAskRequest(42), null);
  });

  test("rejects missing fields", () => {
    assert.equal(parseAskRequest({}), null);
    assert.equal(parseAskRequest({ listingId: KNOWN_ID }), null);
    assert.equal(parseAskRequest({ question: "Hello?" }), null);
  });

  test("rejects non-string field types", () => {
    assert.equal(parseAskRequest({ listingId: 7, question: "Hello?" }), null);
    assert.equal(parseAskRequest({ listingId: KNOWN_ID, question: ["Hello?"] }), null);
    assert.equal(parseAskRequest({ listingId: { id: KNOWN_ID }, question: "Hello?" }), null);
  });

  test("rejects unknown listingId", () => {
    assert.equal(parseAskRequest({ listingId: "no-such-listing", question: "Hello?" }), null);
  });

  test("rejects empty and whitespace-only questions", () => {
    assert.equal(parseAskRequest({ listingId: KNOWN_ID, question: "" }), null);
    assert.equal(parseAskRequest({ listingId: KNOWN_ID, question: "   \n\t " }), null);
  });

  test("rejects questions made only of invisible characters", () => {
    assert.equal(parseAskRequest({ listingId: KNOWN_ID, question: "\u200B\u200C\u200D\uFEFF" }), null);
    assert.equal(parseAskRequest({ listingId: KNOWN_ID, question: "\u00AD\u200B \u2060" }), null);
  });

  test("strips invisible characters from an otherwise valid question", () => {
    const result = parseAskRequest({ listingId: KNOWN_ID, question: "Is\u200B there\u200D parking?" });
    assert.equal(result?.question, "Is there parking?");
  });

  test("applies NFKC normalization", () => {
    const result = parseAskRequest({ listingId: KNOWN_ID, question: "\uFF28\uFF2F\uFF21?" });
    assert.equal(result?.question, "HOA?");
  });

  test("accepts a question of exactly the maximum length", () => {
    const question = "a".repeat(MAX_QUESTION_LENGTH);
    const result = parseAskRequest({ listingId: KNOWN_ID, question });
    assert.equal(result?.question, question);
  });

  test("rejects a question one character over the maximum length", () => {
    const question = "a".repeat(MAX_QUESTION_LENGTH + 1);
    assert.equal(parseAskRequest({ listingId: KNOWN_ID, question }), null);
  });

  test("length limit is measured after trimming", () => {
    const question = `  ${"a".repeat(MAX_QUESTION_LENGTH)}  `;
    const result = parseAskRequest({ listingId: KNOWN_ID, question });
    assert.equal(result?.question.length, MAX_QUESTION_LENGTH);
  });

  test("ignores extra properties in the body", () => {
    const result = parseAskRequest({ listingId: KNOWN_ID, question: "Hello?", extra: true });
    assert.equal(result?.question, "Hello?");
  });
});
