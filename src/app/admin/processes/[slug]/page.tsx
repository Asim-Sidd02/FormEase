import { notFound } from "next/navigation";
import { getProcess } from "@/content/processes";
import { ProcessEditor } from "./editor";

export default async function EditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProcess(slug)) notFound();
  return <ProcessEditor slug={slug} />;
}
