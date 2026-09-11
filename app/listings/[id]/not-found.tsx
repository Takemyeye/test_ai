import Link from "next/link";

export default function ListingNotFound() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold">Listing not found</h1>
      <Link href="/" className="text-sm text-gray-600 hover:underline">
        ← All listings
      </Link>
    </div>
  );
}
