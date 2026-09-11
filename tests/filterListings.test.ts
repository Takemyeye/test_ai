import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FILTERS,
  countActiveFilters,
  filterListings,
  normalizeQuery,
  uniqueNeighborhoods,
  type ListingFilters,
} from "../lib/filterListings.ts";
import { listings, type Listing } from "../lib/listings.ts";

function buildListing(overrides: Partial<Listing>): Listing {
  return {
    id: "fixture",
    title: "Fixture Listing",
    type: "house",
    price: 500000,
    beds: 2,
    baths: 1,
    sqft: 1000,
    yearBuilt: 2000,
    neighborhood: "Fixture Town",
    description: "A plain fixture.",
    features: [],
    image: "/listings/fixture.svg",
    ...overrides,
  };
}

function withFilters(overrides: Partial<ListingFilters>): ListingFilters {
  return { ...DEFAULT_FILTERS, ...overrides };
}

function ids(result: Listing[]): string[] {
  return result.map((listing) => listing.id);
}

function isSortedBy(result: Listing[], pick: (listing: Listing) => number, direction: "asc" | "desc"): boolean {
  return result.every((listing, index) => {
    if (index === 0) return true;
    const previous = pick(result[index - 1]);
    const current = pick(listing);
    return direction === "asc" ? previous <= current : previous >= current;
  });
}

describe("normalizeQuery", () => {
  test("trims, lowercases and collapses whitespace", () => {
    assert.equal(normalizeQuery("  Harbor   VIEWS \n loft "), "harbor views loft");
  });

  test("returns empty string for whitespace-only input", () => {
    assert.equal(normalizeQuery("   \t "), "");
  });
});

describe("filterListings", () => {
  test("default filters return every listing sorted by price ascending", () => {
    const result = filterListings(listings, DEFAULT_FILTERS);
    assert.equal(result.length, listings.length);
    assert.deepEqual(new Set(ids(result)), new Set(ids(listings)));
    assert.ok(isSortedBy(result, (listing) => listing.price, "asc"));
  });

  test("does not mutate the input array", () => {
    const original = [...listings];
    filterListings(listings, withFilters({ sort: "price-desc" }));
    assert.deepEqual(ids(listings), ids(original));
  });

  test("type filter keeps only the requested property type", () => {
    const result = filterListings(listings, withFilters({ type: "condo" }));
    assert.ok(result.length > 0);
    assert.ok(result.every((listing) => listing.type === "condo"));
    assert.equal(result.length, listings.filter((listing) => listing.type === "condo").length);
  });

  test("neighborhood filter keeps only matching neighborhood", () => {
    const result = filterListings(listings, withFilters({ neighborhood: "Ballard" }));
    assert.deepEqual(ids(result), ["maple-craftsman"]);
  });

  test("neighborhood filter is exact and case-sensitive", () => {
    const result = filterListings(listings, withFilters({ neighborhood: "ballard" }));
    assert.deepEqual(result, []);
  });

  test("minBeds keeps listings with at least that many beds", () => {
    const result = filterListings(listings, withFilters({ minBeds: 4 }));
    assert.ok(result.length > 0);
    assert.ok(result.every((listing) => listing.beds >= 4));
    assert.ok(ids(result).includes("lakeview-rambler"));
    assert.ok(!ids(result).includes("maple-craftsman"));
  });

  test("minBeds of zero keeps studios", () => {
    const result = filterListings(listings, withFilters({ minBeds: 0 }));
    assert.ok(ids(result).includes("pioneer-studio"));
  });

  test("maxPrice is inclusive", () => {
    const result = filterListings(listings, withFilters({ maxPrice: 745000 }));
    assert.ok(result.every((listing) => listing.price <= 745000));
    assert.ok(ids(result).includes("maple-craftsman"));
    assert.ok(!ids(result).includes("redmond-trail-townhome"));
  });

  test("maxPrice null means no upper limit", () => {
    const result = filterListings(listings, withFilters({ maxPrice: null }));
    assert.equal(result.length, listings.length);
  });

  test("query matches title case-insensitively", () => {
    const result = filterListings(listings, withFilters({ query: "HARBOR views" }));
    assert.deepEqual(ids(result), ["harbor-loft"]);
  });

  test("query matches against neighborhood", () => {
    const result = filterListings(listings, withFilters({ query: "capitol hill" }));
    assert.ok(ids(result).includes("capitol-townhome"));
  });

  test("query matches against description", () => {
    const result = filterListings(listings, withFilters({ query: "apple tree" }));
    assert.deepEqual(ids(result), ["maple-craftsman"]);
  });

  test("query matches against features", () => {
    const result = filterListings(listings, withFilters({ query: "three-car garage" }));
    assert.deepEqual(ids(result), ["cedar-family"]);
  });

  test("multi-word query requires every word, across different fields", () => {
    const fixtures = [
      buildListing({ id: "both", title: "Sunny Cottage", features: ["Garden shed"] }),
      buildListing({ id: "title-only", title: "Sunny Flat", features: [] }),
      buildListing({ id: "feature-only", title: "Dark Flat", features: ["Garden shed"] }),
    ];
    const result = filterListings(fixtures, withFilters({ query: "sunny   GARDEN" }));
    assert.deepEqual(ids(result), ["both"]);
  });

  test("query with no matches returns empty array", () => {
    const result = filterListings(listings, withFilters({ query: "zzzz-not-present" }));
    assert.deepEqual(result, []);
  });

  test("filters combine with AND semantics", () => {
    const result = filterListings(listings, withFilters({ type: "house", minBeds: 4, maxPrice: 1200000 }));
    assert.ok(result.length > 0);
    assert.ok(result.every((listing) => listing.type === "house" && listing.beds >= 4 && listing.price <= 1200000));
  });

  test("sort price-asc", () => {
    const result = filterListings(listings, withFilters({ sort: "price-asc" }));
    assert.ok(isSortedBy(result, (listing) => listing.price, "asc"));
    assert.equal(result[0].id, "pioneer-studio");
  });

  test("sort price-desc", () => {
    const result = filterListings(listings, withFilters({ sort: "price-desc" }));
    assert.ok(isSortedBy(result, (listing) => listing.price, "desc"));
    assert.equal(result[0].id, "queen-anne-victorian");
  });

  test("sort sqft-desc", () => {
    const result = filterListings(listings, withFilters({ sort: "sqft-desc" }));
    assert.ok(isSortedBy(result, (listing) => listing.sqft, "desc"));
    assert.equal(result[0].id, "cedar-family");
  });

  test("sort newest puts the most recent yearBuilt first", () => {
    const result = filterListings(listings, withFilters({ sort: "newest" }));
    assert.ok(isSortedBy(result, (listing) => listing.yearBuilt, "desc"));
    assert.equal(result[0].id, "capitol-townhome");
  });
});

describe("uniqueNeighborhoods", () => {
  test("returns deduplicated neighborhoods sorted alphabetically", () => {
    const fixtures = [
      buildListing({ neighborhood: "Fremont" }),
      buildListing({ neighborhood: "Ballard" }),
      buildListing({ neighborhood: "Fremont" }),
      buildListing({ neighborhood: "Alki" }),
    ];
    assert.deepEqual(uniqueNeighborhoods(fixtures), ["Alki", "Ballard", "Fremont"]);
  });

  test("covers every neighborhood in the dataset exactly once", () => {
    const result = uniqueNeighborhoods(listings);
    assert.equal(result.length, new Set(listings.map((listing) => listing.neighborhood)).size);
    assert.deepEqual(result, [...result].sort((a, b) => a.localeCompare(b, "en-US")));
  });
});

describe("countActiveFilters", () => {
  test("default filters count as zero", () => {
    assert.equal(countActiveFilters(DEFAULT_FILTERS), 0);
  });

  test("sort does not count as an active filter", () => {
    assert.equal(countActiveFilters(withFilters({ sort: "newest" })), 0);
  });

  test("whitespace-only query does not count", () => {
    assert.equal(countActiveFilters(withFilters({ query: "   " })), 0);
  });

  test("each non-default filter adds one", () => {
    assert.equal(countActiveFilters(withFilters({ query: "loft" })), 1);
    assert.equal(countActiveFilters(withFilters({ type: "condo", minBeds: 2 })), 2);
    assert.equal(
      countActiveFilters(withFilters({ query: "loft", type: "condo", neighborhood: "Belltown", minBeds: 1, maxPrice: 700000 })),
      5,
    );
  });
});
