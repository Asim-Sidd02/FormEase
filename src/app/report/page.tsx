import type { Metadata } from "next";
import { PageHero } from "@/components/prose-page";
import { ReportForm } from "./report-form";

export const metadata: Metadata = { title: "Report an issue" };

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ request?: string }> }) {
  const { request } = await searchParams;
  return (
    <>
      <PageHero
        eyebrow="Feedback"
        title={request ? "Request a process" : "Report an issue"}
        desc={request ? "Tell us which process you need. We prioritise guides by demand — and only publish once they're verified." : "Spotted outdated information, a broken link or something confusing? Tell us — every report is reviewed by our editorial team."}
      />
      <ReportForm request={request} />
    </>
  );
}
