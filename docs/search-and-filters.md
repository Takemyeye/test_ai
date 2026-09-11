# Search and filters

The home page lets the user narrow the 16 listings by text, property type, neighborhood, bedrooms and price, and sort the result. The logic lives in [`lib/filterListings.ts`](../lib/filterListings.ts) as pure functions; [`components/ListingExplorer.tsx`](../components/ListingExplorer.tsx) holds the UI state and calls them.

## Where it runs

Entirely in the browser. [`app/page.tsx`](../app/page.tsx) is a server component that passes the whole `listings` array as a prop to `ListingExplorer`, a `"use client"` component. Every keystroke or select change updates a `ListingFilters` object in `useState`; `filterListings(listings, filters)` is recomputed in a `useMemo`. No network request is made, no URL state is written, and a page reload resets the filters.

## The filter state

```ts
type ListingFilters = {
  query: string;
  type: PropertyType | "all";
  neighborhood: string;
  minBeds: number;
  maxPrice: number | null;
  sort: SortOption;
};
```

`DEFAULT_FILTERS` is `{ query: "", type: "all", neighborhood: "all", minBeds: 0, maxPrice: null, sort: "price-asc" }`.

## Each filter

Filters are applied in this order and combine with AND semantics: a listing must pass all of them.

| Filter | UI control | Rule |
| --- | --- | --- |
| `type` | Pill buttons: All types, House, Condo, Townhome, Multi-family (`aria-pressed` marks the active one). | `"all"` passes everything; otherwise `listing.type === filters.type`. |
| `neighborhood` | Select built from `uniqueNeighborhoods(listings)` plus an "Any" option with value `"all"`. | `"all"` passes everything; otherwise exact, case-sensitive string equality with `listing.neighborhood`. |
| `minBeds` | Select with Any, 1+, 2+, 3+, 4+, 5+ (`BED_OPTIONS = [0, 1, 2, 3, 4, 5]`). | `listing.beds >= filters.minBeds`. `0` keeps studios. |
| `maxPrice` | Select with Any and "Up to $600,000", "$800,000", "$1,000,000", "$1,250,000", "$1,500,000" (`PRICE_OPTIONS`). | `null` passes everything; otherwise `listing.price <= filters.maxPrice` (inclusive). |
| `query` | Search input (`type="search"`). | See below. |

## Query matching

`normalizeQuery(query)` trims, lowercases and collapses any run of whitespace to a single space. An empty normalised query matches every listing.

For a non-empty query, `matchesQuery` builds one haystack string per listing by joining `title`, `neighborhood`, `description` and every entry of `features` with spaces and lowercasing it. The query is split on single spaces and every word must appear as a substring of the haystack:

- Multi-word queries are AND, not phrase: `"harbor views"` matches a listing whose title contains "Harbor Views", and `"sunny garden"` matches a listing whose title contains "Sunny" and whose features contain "Garden", even though the words are in different fields.
- Matching is case-insensitive on both sides.
- Words are substrings, not tokens: `"gar"` matches "garage" and "garden".
- Fields that are not searched: `id`, `type` (search for "condo" only hits listings whose text happens to contain the word), `price`, `beds`, `baths`, `sqft`, `yearBuilt`, `image`.
- Because fields are joined with a space, a word can in principle span the boundary between two fields. This is a side effect of the implementation, not a feature.

## Sort options

`SortOption` and `SORT_LABELS`:

| Value | Label | Comparator |
| --- | --- | --- |
| `price-asc` | Price: low to high | `a.price - b.price` (default) |
| `price-desc` | Price: high to low | `b.price - a.price` |
| `sqft-desc` | Size: largest first | `b.sqft - a.sqft` |
| `newest` | Year built: newest first | `b.yearBuilt - a.yearBuilt` |

Sort is applied after filtering with `Array.prototype.sort` on the filtered copy, so the input array is not mutated. Ties keep their relative order from `lib/listings.ts`.

## Active-filter count and reset

`countActiveFilters(filters)` returns how many of the five filters differ from their default: non-empty normalised `query`, `type !== "all"`, `neighborhood !== "all"`, `minBeds > 0`, `maxPrice !== null`. Sort is never counted. A whitespace-only query counts as zero.

When the count is above zero the explorer shows a "Clear filter" / "Clear N filters" link. Reset restores `DEFAULT_FILTERS` but preserves the current `sort`.

## Result count and empty state

Above the grid the explorer shows either `16 listings` (nothing filtered out) or `N of 16 listings`, in a `<p aria-live="polite">` so screen readers announce changes. When `N` is zero the grid is replaced by a dashed panel with "No listings match these filters." and a "Clear filters" button that calls the same reset.

## Extension points

- New filter: add a field to `ListingFilters` and `DEFAULT_FILTERS`, add a `.filter()` step in `filterListings`, add the field to the array in `countActiveFilters` if it should count, and add a control in `ListingExplorer` that calls `update(key, value)`.
- New sort: add a value to `SortOption`, a label in `SORT_LABELS` (the select is generated from it) and a case in `compare`. The switch has no default, so a missing case is a type error.
- Searching more fields: extend the array in `matchesQuery`. Numeric fields would need to be stringified first.
- Different bed or price steps: edit `BED_OPTIONS` / `PRICE_OPTIONS` in the explorer; the logic does not depend on them.
- Shareable filter state: the state is local `useState`; syncing it to `URLSearchParams` would be the natural addition and would not touch `lib/filterListings.ts`.

Unit tests for all of these functions are in [`tests/filterListings.test.ts`](../tests/filterListings.test.ts); see [testing.md](testing.md).
