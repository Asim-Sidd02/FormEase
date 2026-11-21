import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProcess, processes } from "@/content/processes";
import { ProcessDetail } from "./process-detail";

export function generateStaticParams() {
  return processes.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProcess((await params).slug);
  if (!p) return { title: "Not found" };
  return { title: p.title, description: p.summary };
}

export default async function ProcessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProcess(slug)) notFound();
  return <ProcessDetail slug={slug} />;
}
