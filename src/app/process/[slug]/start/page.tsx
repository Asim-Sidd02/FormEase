import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProcess, processes } from "@/content/processes";
import { Wizard } from "./wizard";

export function generateStaticParams() {
  return processes.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProcess((await params).slug);
  return { title: p ? `Personalise: ${p.shortTitle}` : "Not found" };
}

export default async function StartPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ journey?: string }> }) {
  const { slug } = await params;
  const { journey } = await searchParams;
  if (!getProcess(slug)) notFound();
  return <Wizard slug={slug} journeyId={journey} />;
}
