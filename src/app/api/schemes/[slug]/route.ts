import { NextResponse } from "next/server";
import { adminAllowed } from "@/lib/sources/auth";
import { deleteScheme, getScheme } from "@/lib/schemes/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const scheme = await getScheme(slug).catch(() => null);
  if (!scheme || (scheme.status !== "published" && !adminAllowed(req))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ scheme });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  if (!adminAllowed(req)) return NextResponse.json({ error: "Admin token required" }, { status: 403 });
  const { slug } = await ctx.params;
  await deleteScheme(slug);
  return NextResponse.json({ ok: true });
}
