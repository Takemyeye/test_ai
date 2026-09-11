import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PROPERTY_TYPE_LABELS, formatPrice, getListing, listings } from "../lib/listings.ts";

const PUBLIC_DIR = join(import.meta.dirname, "..", "public");

function isPositive(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

describe("listings dataset", () => {
  test("is non-empty", () => {
    assert.ok(listings.length > 0);
  });

  test("ids are unique and url-safe", () => {
    const ids = listings.map((listing) => listing.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
  });

  test("every listing has non-empty title, description and features", () => {
    for (const listing of listings) {
      assert.ok(listing.title.trim().length > 0, `${listing.id} title`);
      assert.ok(listing.description.trim().length > 0, `${listing.id} description`);
      assert.ok(listing.features.length > 0, `${listing.id} features`);
      for (const feature of listing.features) assert.ok(feature.trim().length > 0, `${listing.id} feature`);
    }
  });

  test("numeric fields are sane", () => {
    for (const listing of listings) {
      assert.ok(isPositive(listing.price), `${listing.id} price`);
      assert.ok(Number.isInteger(listing.beds) && listing.beds >= 0, `${listing.id} beds`);
      assert.ok(isPositive(listing.baths), `${listing.id} baths`);
      assert.ok(isPositive(listing.sqft), `${listing.id} sqft`);
      assert.ok(Number.isInteger(listing.yearBuilt) && listing.yearBuilt > 1800 && listing.yearBuilt <= new Date().getFullYear(), `${listing.id} yearBuilt`);
    }
  });

  test("every type has a label", () => {
    for (const listing of listings) {
      assert.ok(listing.type in PROPERTY_TYPE_LABELS, `${listing.id} type ${listing.type}`);
    }
  });

  test("image paths follow the /listings/<id>.svg convention", () => {
    for (const listing of listings) {
      assert.ok(listing.image.startsWith("/listings/"), `${listing.id} image prefix`);
      assert.ok(listing.image.endsWith(".svg"), `${listing.id} image extension`);
      assert.equal(listing.image, `/listings/${listing.id}.svg`);
    }
  });

  test("every image file exists in public/", () => {
    const missing = listings.map((listing) => listing.image).filter((image) => !existsSync(join(PUBLIC_DIR, image)));
    assert.deepEqual(missing, []);
  });
});

describe("getListing", () => {
  test("returns the listing for a known id", () => {
    const listing = getListing("maple-craftsman");
    assert.equal(listing?.id, "maple-craftsman");
    assert.equal(listing?.title, "Renovated Craftsman on Maple Street");
  });

  test("returns undefined for unknown id", () => {
    assert.equal(getListing("does-not-exist"), undefined);
    assert.equal(getListing(""), undefined);
  });
});

describe("formatPrice", () => {
  test("formats as USD without cents", () => {
    assert.equal(formatPrice(745000), "$745,000");
    assert.equal(formatPrice(1195000), "$1,195,000");
  });

  test("rounds fractional values", () => {
    assert.equal(formatPrice(999.6), "$1,000");
  });
});
