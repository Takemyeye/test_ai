import type { Listing, PropertyType } from "./listings";

export type SortOption = "price-asc" | "price-desc" | "sqft-desc" | "newest";

export type ListingFilters = {
  query: string;
  type: PropertyType | "all";
  neighborhood: string;
  minBeds: number;
  maxPrice: number | null;
  sort: SortOption;
};

export const SORT_LABELS: Record<SortOption, string> = {
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "sqft-desc": "Size: largest first",
  newest: "Year built: newest first",
};

export const DEFAULT_FILTERS: ListingFilters = {
  query: "",
  type: "all",
  neighborhood: "all",
  minBeds: 0,
  maxPrice: null,
  sort: "price-asc",
};

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function matchesQuery(listing: Listing, query: string): boolean {
  if (!query) return true;
  const haystack = [listing.title, listing.neighborhood, listing.description, ...listing.features].join(" ").toLowerCase();
  return query.split(" ").every((word) => haystack.includes(word));
}

function compare(sort: SortOption): (a: Listing, b: Listing) => number {
  switch (sort) {
    case "price-asc":
      return (a, b) => a.price - b.price;
    case "price-desc":
      return (a, b) => b.price - a.price;
    case "sqft-desc":
      return (a, b) => b.sqft - a.sqft;
    case "newest":
      return (a, b) => b.yearBuilt - a.yearBuilt;
  }
}

export function filterListings(listings: readonly Listing[], filters: ListingFilters): Listing[] {
  const query = normalizeQuery(filters.query);
  return listings
    .filter((listing) => filters.type === "all" || listing.type === filters.type)
    .filter((listing) => filters.neighborhood === "all" || listing.neighborhood === filters.neighborhood)
    .filter((listing) => listing.beds >= filters.minBeds)
    .filter((listing) => filters.maxPrice === null || listing.price <= filters.maxPrice)
    .filter((listing) => matchesQuery(listing, query))
    .sort(compare(filters.sort));
}

export function uniqueNeighborhoods(listings: readonly Listing[]): string[] {
  return [...new Set(listings.map((listing) => listing.neighborhood))].sort((a, b) => a.localeCompare(b, "en-US"));
}

export function countActiveFilters(filters: ListingFilters): number {
  return [
    normalizeQuery(filters.query) !== "",
    filters.type !== "all",
    filters.neighborhood !== "all",
    filters.minBeds > 0,
    filters.maxPrice !== null,
  ].filter(Boolean).length;
}
