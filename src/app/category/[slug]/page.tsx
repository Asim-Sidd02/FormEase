import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { categories, getCategory } from "@/content/categories";
import { publicProcesses } from "@/content/processes";
import { ProcessCard } from "@/components/process-card";
import { Icon } from "@/components/icon";
import { EmptyState } from "@/components/ui";
import { buttonClass } from "@/components/styles";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = getCategory((await params).slug);
  return { title: c?.name ?? "Category", description: c?.description };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCategory(slug);
  if (!c) notFound();
  const list = publicProcesses.filter((p) => p.category === slug);
  return (
    <div className="container-page pt-8 sm:pt-12">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted">
        <Link href="/" className="hover:text-fg">Home</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href="/search" className="hover:text-fg">Guides</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-semibold text-fg" aria-current="page">{c.name}</span>
      </nav>
      <div className="mt-6 flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Icon name={c.icon} className="size-7" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{c.name}</h1>
          <p className="mt-1 text-muted">{c.description}</p>
        </div>
      </div>
      <div className="mt-10">
        {list.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <ProcessCard key={p.slug} p={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Icon name={c.icon} className="size-6" />}
            title="Coming soon"
            desc="We only publish guides once they've been verified against official sources. Tell us which process you need and we'll prioritise it."
            action={
              <Link href={`/report?request=${encodeURIComponent(c.name)}`} className={buttonClass("outline")}>
                Request a process
              </Link>
            }
          />
        )}
      </div>
      <div className="mt-14">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-subtle">Other categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories
            .filter((x) => x.slug !== slug && x.live)
            .map((x) => (
              <Link key={x.slug} href={`/category/${x.slug}`} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:border-brand/40">
                <Icon name={x.icon} className="size-4 text-brand" /> {x.name}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
