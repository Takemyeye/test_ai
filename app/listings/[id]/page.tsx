import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyQA } from "@/components/PropertyQA";
import { PROPERTY_TYPE_LABELS, formatPrice, getListing, listings } from "@/lib/listings";

export function generateStaticParams() {
  return listings.map((listing) => ({ id: listing.id }));
}

export default async function ListingPage({ params }: PageProps<"/listings/[id]">) {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-sm text-gray-600 hover:underline">
        ← All listings
      </Link>
      <section className="flex flex-col gap-4">
        <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
          <Image
            src={listing.image}
            alt={`Illustration of ${listing.title}`}
            width={640}
            height={400}
            unoptimized
            priority
            className="h-full w-full object-cover"
          />
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-gray-800 shadow-sm">
            {PROPERTY_TYPE_LABELS[listing.type]}
          </span>
        </div>
        <h1 className="text-2xl font-semibold">{listing.title}</h1>
        <p className="text-xl">{formatPrice(listing.price)}</p>
        <p className="text-gray-600">
          {listing.beds} bd · {listing.baths} ba · {listing.sqft.toLocaleString("en-US")} sqft · Built {listing.yearBuilt} ·{" "}
          {listing.neighborhood}
        </p>
        <p>{listing.description}</p>
        <ul className="flex flex-wrap gap-2">
          {listing.features.map((feature) => (
            <li key={feature} className="rounded-full bg-gray-200 px-3 py-1 text-sm">
              {feature}
            </li>
          ))}
        </ul>
      </section>
      <PropertyQA listingId={listing.id} />
    </div>
  );
}
