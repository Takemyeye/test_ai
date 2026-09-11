import { MAX_QUESTION_LENGTH } from "../../../lib/constants.ts";
import { getListing, type Listing } from "../../../lib/listings.ts";

const INVISIBLE_CHARACTERS = /\p{Cf}|[\0-\x09\x0B-\x1F\x7F-\x9F]/gu;

export type AskRequest = {
  listing: Listing;
  question: string;
};

export function parseAskRequest(body: unknown): AskRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const { listingId, question } = body as Record<string, unknown>;
  if (typeof listingId !== "string" || typeof question !== "string") return null;

  const trimmedQuestion = question.normalize("NFKC").replace(INVISIBLE_CHARACTERS, "").trim();
  if (trimmedQuestion.length === 0 || trimmedQuestion.length > MAX_QUESTION_LENGTH) return null;

  const listing = getListing(listingId);
  if (!listing) return null;

  return { listing, question: trimmedQuestion };
}
