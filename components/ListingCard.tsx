import Image from "next/image";
import Link from "next/link";
import { PROPERTY_TYPE_LABELS, formatPrice, type Listing } from "@/lib/listings";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-colors hover:border-gray-400"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <Image
          src={listing.image}
          alt={`Illustration of ${listing.title}`}
          width={640}
          height={400}
          unoptimized
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm">
          {PROPERTY_TYPE_LABELS[listing.type]}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-lg font-semibold">{formatPrice(listing.price)}</span>
          <span className="text-sm text-gray-500">{listing.neighborhood}</span>
        </div>
        <h2 className="font-medium">{listing.title}</h2>
        <p className="text-sm text-gray-600">
          {listing.beds} bd · {listing.baths} ba · {listing.sqft.toLocaleString("en-US")} sqft · Built {listing.yearBuilt}
        </p>
      </div>
    </Link>
  );
}
