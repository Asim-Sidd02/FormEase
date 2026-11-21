import type { Metadata } from "next";
import { SearchView } from "./search-view";

export const metadata: Metadata = { title: "Find a process" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q = "", category = "" } = await searchParams;
  return <SearchView initialQuery={q} initialCategory={category} />;
}
