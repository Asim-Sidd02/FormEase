import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonClass } from "@/components/styles";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-16 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand">
        <Compass className="size-8" />
      </span>
      <p className="mt-6 font-display text-6xl font-semibold text-line-strong">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold">This page took a wrong turn</h1>
      <p className="mt-2 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.</p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className={buttonClass()}>Go home</Link>
        <Link href="/search" className={buttonClass("outline")}>Browse guides</Link>
      </div>
    </div>
  );
}
