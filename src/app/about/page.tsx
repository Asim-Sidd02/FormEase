import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero, Prose } from "@/components/prose-page";
import { buttonClass } from "@/components/styles";

export const metadata: Metadata = { title: "About FormEase" };

export default function About() {
  return (
    <>
      <PageHero eyebrow="About" title="Nobody should be left wondering what to do next." desc="FormEase is an independent guide to India's official processes — built for people who just want to get it done right the first time." />
      <Prose>
        <h2>Why we exist</h2>
        <p>
          Getting a passport, updating an Aadhaar address or applying for a certificate shouldn&apos;t require detective work. But instructions are spread across portals, PDFs and notices; requirements change with your state, age and situation; and one small mismatch can send an application back.
        </p>
        <p>
          FormEase brings it together. You tell us your situation in a few quick questions, and we give you a roadmap: what to do first, which documents apply to you, where to go officially — and what to do if something goes wrong.
        </p>
        <h2>What we are — and aren&apos;t</h2>
        <ul>
          <li><strong>We are</strong> an independent guidance service. We research official sources and explain them in plain language.</li>
          <li><strong>We are not</strong> a government website, and we&apos;re not affiliated with any government body. We don&apos;t use government logos or seals.</li>
          <li><strong>We never</strong> accept applications or payments, and we can&apos;t speed up or guarantee any outcome.</li>
        </ul>
        <h2>Our principles</h2>
        <ul>
          <li><strong>Clarity over complexity</strong> — plain words, short steps.</li>
          <li><strong>Personal, not generic</strong> — only the steps that apply to you.</li>
          <li><strong>Always a next step</strong> — every journey answers “what now?”.</li>
          <li><strong>Transparent</strong> — sources, verification dates and uncertainty are always visible.</li>
          <li><strong>Official-source-first</strong> — actions happen on official portals.</li>
          <li><strong>Accessible by design</strong> — mobile-first, keyboard and screen-reader friendly.</li>
          <li><strong>No false certainty</strong> — we separate confirmed rules from estimates and tips.</li>
        </ul>
        <div className="mt-10">
          <Link href="/search" className={buttonClass("primary", "lg")}>
            Find your process <ArrowRight className="size-4" />
          </Link>
        </div>
      </Prose>
    </>
  );
}
