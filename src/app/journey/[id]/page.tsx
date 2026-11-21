import type { Metadata } from "next";
import { JourneyView } from "./journey-view";

export const metadata: Metadata = { title: "Your journey", robots: { index: false } };

export default async function JourneyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  return <JourneyView id={id} isNew={isNew === "1"} />;
}
