import type { Metadata } from "next";
import { AssistantPage } from "./assistant-page";

export const metadata: Metadata = { title: "Assistant" };

export default function Page() {
  return <AssistantPage />;
}
