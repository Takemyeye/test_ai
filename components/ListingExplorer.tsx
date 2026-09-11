"use client";

import { useMemo, useState } from "react";
import { ListingCard } from "@/components/ListingCard";
import {
  DEFAULT_FILTERS,
  SORT_LABELS,
  countActiveFilters,
  filterListings,
  uniqueNeighborhoods,
  type ListingFilters,
  type SortOption,
} from "@/lib/filterListings";
import { PROPERTY_TYPE_LABELS, formatPrice, type Listing, type PropertyType } from "@/lib/listings";

const BED_OPTIONS = [0, 1, 2, 3, 4, 5];
const PRICE_OPTIONS = [600000, 800000, 1000000, 1250000, 1500000];
const TYPE_OPTIONS: Array<PropertyType | "all"> = ["all", "house", "condo", "townhome", "multi-family"];

const selectClassName =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none";

export function ListingExplorer({ listings }: { listings: Listing[] }) {
  const [filters, setFilters] = useState<ListingFilters>(DEFAULT_FILTERS);
  const neighborhoods = useMemo(() => uniqueNeighborhoods(listings), [listings]);
  const visible = useMemo(() => filterListings(listings, filters), [listings, filters]);
  const activeCount = countActiveFilters(filters);

  function update<K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setFilters({ ...DEFAULT_FILTERS, sort: filters.sort });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search listings</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            >
              <circle cx="9" cy="9" r="6" />
              <path d="m13.5 13.5 3.5 3.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={filters.query}
              onChange={(event) => update("query", event.target.value)}
              placeholder="Search by title, neighborhood, feature…"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-gray-900 focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="whitespace-nowrap">Sort</span>
            <select
              value={filters.sort}
              onChange={(event) => update("sort", event.target.value as SortOption)}
              className={selectClassName}
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Property type">
          {TYPE_OPTIONS.map((type) => {
            const isActive = filters.type === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => update("type", type)}
                aria-pressed={isActive}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  isActive
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
                }`}
              >
                {type === "all" ? "All types" : PROPERTY_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span>Neighborhood</span>
            <select
              value={filters.neighborhood}
              onChange={(event) => update("neighborhood", event.target.value)}
              className={selectClassName}
            >
              <option value="all">Any</option>
              {neighborhoods.map((neighborhood) => (
                <option key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span>Beds</span>
            <select
              value={filters.minBeds}
              onChange={(event) => update("minBeds", Number(event.target.value))}
              className={selectClassName}
            >
              {BED_OPTIONS.map((beds) => (
                <option key={beds} value={beds}>
                  {beds === 0 ? "Any" : `${beds}+`}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span>Max price</span>
            <select
              value={filters.maxPrice ?? ""}
              onChange={(event) => update("maxPrice", event.target.value === "" ? null : Number(event.target.value))}
              className={selectClassName}
            >
              <option value="">Any</option>
              {PRICE_OPTIONS.map((price) => (
                <option key={price} value={price}>
                  Up to {formatPrice(price)}
                </option>
              ))}
            </select>
          </label>
          {activeCount > 0 && (
            <button type="button" onClick={reset} className="text-sm text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline">
              Clear {activeCount === 1 ? "filter" : `${activeCount} filters`}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">Listings</h2>
        <p className="text-sm text-gray-500" aria-live="polite">
          {visible.length === listings.length
            ? `${listings.length} listings`
            : `${visible.length} of ${listings.length} listings`}
        </p>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="font-medium">No listings match these filters.</p>
          <p className="text-sm text-gray-600">Try a broader search or clear some filters.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
