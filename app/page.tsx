import { ListingExplorer } from "@/components/ListingExplorer";
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
          Browse {listings.length} listings around Seattle. Search and filter by type, neighborhood, beds, or price, then
          open any property and ask free-form questions, such as whether it suits a family, how the commute looks, or what
          the HOA covers. The assistant answers from that listing&apos;s data only and tells you when the information is
          not there.
        </p>
      </section>
      <ListingExplorer listings={listings} />
    </div>
  );
}
