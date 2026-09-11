# Data model

All listing data is hardcoded in [`lib/listings.ts`](../lib/listings.ts). There is no database, no persistence and no admin UI. The same module is imported by the Next.js pages, the `ListingExplorer` client component, the Express validation layer and the tests.

## `PropertyType`

```ts
export type PropertyType = "house" | "condo" | "townhome" | "multi-family";
```

`PROPERTY_TYPE_LABELS` maps each value to the text shown in the UI (the badge on cards and detail pages, and the type pills in the explorer):

| Value | Label |
| --- | --- |
| `house` | House |
| `condo` | Condo |
| `townhome` | Townhome |
| `multi-family` | Multi-family |

Adding a value to the union without adding a label is a type error because `PROPERTY_TYPE_LABELS` is a `Record<PropertyType, string>`. The explorer's pill list (`TYPE_OPTIONS` in [`components/ListingExplorer.tsx`](../components/ListingExplorer.tsx)) is a separate array and has to be extended by hand.

## `Listing`

| Field | Type | Meaning and constraints |
| --- | --- | --- |
| `id` | `string` | URL slug and primary key. Lowercase letters, digits and hyphens only (checked by `tests/listings.test.ts`). Used in `/listings/<id>`, as `listingId` in the API body, and as the `sessionStorage` key suffix for chat history. |
| `title` | `string` | Headline shown on cards and the detail page. Searched by the explorer. |
| `type` | `PropertyType` | Property category. Drives the badge label and the type filter. |
| `price` | `number` | Asking price in whole US dollars. Formatted by `formatPrice` (`$745,000`). Used by the max-price filter and the two price sorts. |
| `beds` | `number` | Bedroom count; `0` for a studio. Integer. Used by the min-beds filter. |
| `baths` | `number` | Bathroom count; fractional values such as `2.5` or `1.75` are used. |
| `sqft` | `number` | Interior area in square feet. Used by the size sort. |
| `yearBuilt` | `number` | Four-digit year. Used by the "newest" sort and shown as "Built YYYY". |
| `neighborhood` | `string` | Free-text neighborhood or city name. Exact-match filter option in the explorer (the dropdown is built from the distinct values) and part of the search text. |
| `description` | `string` | One paragraph of prose. Searched by the explorer and the main source of facts for the Q&A model. |
| `features` | `string[]` | Short bullet facts rendered as pills on the detail page. Searched by the explorer. |
| `image` | `string` | Public URL path of the illustration, always `/listings/<id>.svg`. Rendered with `next/image` and `unoptimized`. Excluded from the LLM prompt. |

Helpers exported from the same file:

- `listings: Listing[]`: the full array, 16 entries, all in the Seattle area.
- `getListing(id)`: linear `find` by id, returns `undefined` when missing. Used by the detail page and by server-side validation.
- `formatPrice(price)`: `Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })`.

## Current dataset

| id | type | neighborhood | price | beds |
| --- | --- | --- | --- | --- |
| `maple-craftsman` | house | Ballard | 745,000 | 3 |
| `harbor-loft` | condo | Belltown | 615,000 | 1 |
| `cedar-family` | house | Bellevue | 1,195,000 | 5 |
| `capitol-townhome` | townhome | Capitol Hill | 899,000 | 3 |
| `lakeview-rambler` | house | Kirkland | 985,000 | 4 |
| `pioneer-studio` | condo | Pioneer Square | 329,000 | 0 |
| `greenlake-duplex` | multi-family | Green Lake | 1,050,000 | 4 |
| `queen-anne-victorian` | house | Queen Anne | 1,650,000 | 4 |
| `columbia-city-bungalow` | house | Columbia City | 589,000 | 2 |
| `fremont-condo` | condo | Fremont | 675,000 | 2 |
| `alki-view-home` | house | West Seattle | 1,125,000 | 3 |
| `redmond-trail-townhome` | townhome | Redmond | 779,000 | 2 |
| `wallingford-tudor` | house | Wallingford | 1,010,000 | 3 |
| `slu-condo` | condo | South Lake Union | 529,000 | 1 |
| `issaquah-acreage` | house | Issaquah | 1,395,000 | 4 |
| `beacon-hill-triplex` | multi-family | Beacon Hill | 1,275,000 | 6 |

## Adding a listing

1. Pick an id: lowercase letters, digits and hyphens, unique across the array. The tests enforce `^[a-z0-9-]+$`.
2. Create `public/listings/<id>.svg`. The existing files are hand-drawn 640 x 400 SVGs (`viewBox="0 0 640 400"`) with `role="img"` and an `aria-label`. Keep the 16:10 aspect ratio; the card crops to 16:10 and the detail page to 16:7 with `object-cover`. Do not reference external resources from the SVG: the CSP only allows same-origin images, and `next/image` is given `unoptimized` so the file is served byte-for-byte.
3. Append an object to `listings` in `lib/listings.ts` with every field filled in. Set `image` to exactly `/listings/<id>.svg`; a test asserts that the path matches the id and that the file exists.
4. If the listing introduces a new neighborhood, nothing else is needed: the explorer builds its dropdown from `uniqueNeighborhoods(listings)`.
5. If it introduces a new property type, extend `PropertyType`, `PROPERTY_TYPE_LABELS` and `TYPE_OPTIONS`.
6. Run `npm test` and `npm run typecheck`. The detail page is statically generated from `generateStaticParams`, so a rebuild (`npm run build`) is needed for production output; `npm run dev` picks the change up immediately.

Put facts the model should be able to answer about (HOA, commute, parking, schools, rental income) into `description` or `features`; the model is instructed to answer only from the listing data and to say when something is missing.

## What goes into the LLM prompt

[`api/src/addons/openrouter.ts`](../api/src/addons/openrouter.ts) serialises the validated listing with `JSON.stringify(listing, omitImage, 2)`, where `omitImage` is a replacer that drops the `image` key. Every other field (`id`, `title`, `type`, `price`, `beds`, `baths`, `sqft`, `yearBuilt`, `neighborhood`, `description`, `features`) is sent verbatim as pretty-printed JSON inside `<listing>` tags, followed by the user's question inside `<question>` tags with `<` replaced by `&lt;`. The image path carries no information the model needs and stripping it keeps internal paths out of the provider request.

The listing is looked up server-side from the `listingId` in the request; the client never sends listing content, so a caller cannot feed the model a listing that is not in `lib/listings.ts`.
