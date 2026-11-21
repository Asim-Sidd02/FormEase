import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { PageHero, Prose } from "@/components/prose-page";

export const metadata: Metadata = { title: "Disclaimer" };

export default function Disclaimer() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Disclaimer" />
      <Prose>
        <div className="flex gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-5 text-fg">
          <ShieldAlert className="mt-0.5 size-6 shrink-0 text-warning" />
          <p className="!mt-0">
            <strong>FormEase is an independent guidance service. It is not a government website and is not affiliated with, endorsed by or acting on behalf of any government ministry, department or authority.</strong>
          </p>
        </div>
        <h2>Information only</h2>
        <p>Content on FormEase is for general information. It is researched from official sources and reviewed, but rules change and errors are possible. The official portal or issuing office is always the final authority.</p>
        <h2>No applications or payments</h2>
        <p>We never accept applications, documents or government fee payments. Beware of anyone claiming to act for FormEase who asks for money, OTPs or documents.</p>
        <h2>Estimates are not commitments</h2>
        <p>Time estimates labelled &ldquo;Estimate&rdquo; come from our research, not from the authority. No one can guarantee processing times or approval.</p>
        <h2>High-stakes situations</h2>
        <p>For legal disputes, immigration matters, court orders, significant financial decisions or anything where a mistake has serious consequences, consult the issuing office directly or a qualified professional.</p>
        <h2>Names and marks</h2>
        <p>Names of government schemes, documents and portals are used only to describe them. We do not use government logos, seals or emblems.</p>
      </Prose>
    </>
  );
}
