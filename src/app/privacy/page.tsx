import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/prose-page";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Privacy() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy policy" desc="Short version: we collect as little as possible, never ask for your ID numbers, and you can delete everything at any time." />
      <Prose>
        <p className="text-sm">Draft for review — last updated 22 November 2026. This page must be reviewed by qualified counsel before public launch.</p>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Account details</strong> — your email address and, optionally, a first name and state preference.</li>
          <li><strong>Journey data</strong> — your category-level wizard answers (for example “adult” or “normal scheme”), step statuses, checklist ticks, notes and reminders you create.</li>
          <li><strong>Feedback</strong> — reports you submit, and an email address only if you ask us to follow up.</li>
          <li><strong>Assistant questions</strong> — processed to answer you. We minimise retention and automatically try to remove ID-like numbers.</li>
        </ul>
        <h2>What we never ask for</h2>
        <ul>
          <li>Aadhaar, PAN, passport, voter ID or application numbers</li>
          <li>Bank details, OTPs or passwords</li>
          <li>Uploads of your identity documents</li>
        </ul>
        <p>Please don&apos;t add these to notes or assistant messages either.</p>
        <h2>Guest mode</h2>
        <p>If you don&apos;t sign in, your journeys are stored only in your browser on this device. Clearing your browser data removes them.</p>
        <h2>How we use your data</h2>
        <ul>
          <li>To show and save your journeys and send reminders you set up.</li>
          <li>To improve guide accuracy from reports and aggregate, non-identifying usage patterns.</li>
          <li>We do not sell your data, and sponsors or partners never get access to it.</li>
        </ul>
        <h2>Security</h2>
        <p>Data is encrypted in transit and at rest where stored. Admin tools are protected by role-based access and audit logs.</p>
        <h2>Your controls</h2>
        <p>From <a href="/account">Account &amp; privacy</a> you can export your data, turn off the assistant&apos;s access to journey context, change notification settings or permanently delete your account.</p>
      </Prose>
    </>
  );
}
