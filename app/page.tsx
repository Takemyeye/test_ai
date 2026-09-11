import { ListingCard } from "@/components/ListingCard";
import { listings } from "@/lib/listings";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
        <span className="inline-block rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
          AI-powered Q&amp;A
        </span>
        <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Find a home, then ask it anything.</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Browse {listings.length} listings around Seattle. Open any property and ask free-form questions, such as whether
          it suits a family, how the commute looks, or what the HOA covers. The assistant answers from that listing&apos;s
          data only and tells you when the information is not there.
        </p>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Listings</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}
