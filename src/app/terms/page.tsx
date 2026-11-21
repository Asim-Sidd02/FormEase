import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/prose-page";

export const metadata: Metadata = { title: "Terms of use" };

export default function Terms() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of use" desc="The rules for using FormEase, in plain language." />
      <Prose>
        <p className="text-sm">Draft for review — last updated 22 November 2026. This page must be reviewed by qualified counsel before public launch.</p>
        <h2>1. What FormEase provides</h2>
        <p>FormEase provides general, informational guidance about official processes in India. It is not legal, financial or professional advice, and it is not a government service.</p>
        <h2>2. Official sources are authoritative</h2>
        <p>Rules, fees, documents and timelines can change without notice. Always confirm details on the official portal or with the issuing office before acting. Where FormEase and an official source differ, the official source prevails.</p>
        <h2>3. No guarantees</h2>
        <p>We do not guarantee approval, eligibility, processing times or any outcome. Estimates are labelled as estimates.</p>
        <h2>4. Your responsibilities</h2>
        <ul>
          <li>Provide truthful information in your official applications.</li>
          <li>Don&apos;t use FormEase to create, alter or misrepresent documents.</li>
          <li>Don&apos;t store sensitive identifiers in notes or assistant messages.</li>
        </ul>
        <h2>5. Third parties</h2>
        <p>Official links take you to sites we don&apos;t control. Any partner or assisted services will be clearly labelled, with transparent pricing kept separate from government fees.</p>
        <h2>6. Accounts</h2>
        <p>You can delete your account at any time. We may suspend accounts used for abuse.</p>
      </Prose>
    </>
  );
}
