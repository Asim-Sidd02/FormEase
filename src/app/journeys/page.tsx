import type { Metadata } from "next";
import { JourneysList } from "./journeys-list";

export const metadata: Metadata = { title: "My journeys" };

export default function JourneysPage() {
  return <JourneysList />;
}
