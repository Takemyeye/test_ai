import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Property Listing Assistant",
  description: "Browse listings and ask questions about any property.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto w-full max-w-5xl px-4 py-4">
            <Link href="/" className="text-lg font-semibold">
              Property Listing Assistant
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
