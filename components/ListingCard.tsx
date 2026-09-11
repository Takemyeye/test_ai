import Link from "next/link";
import { formatPrice, type Listing } from "@/lib/listings";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-400"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-lg font-semibold">{formatPrice(listing.price)}</span>
        <span className="text-sm text-gray-500">{listing.neighborhood}</span>
      </div>
      <h2 className="font-medium">{listing.title}</h2>
      <p className="text-sm text-gray-600">
        {listing.beds} bd · {listing.baths} ba · {listing.sqft.toLocaleString("en-US")} sqft
      </p>
    </Link>
  );
}
