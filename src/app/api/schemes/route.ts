import { NextResponse } from "next/server";
import { adminAllowed } from "@/lib/sources/auth";
import { getScheme, listSchemes, saveScheme, validateScheme } from "@/lib/schemes/server";

export const dynamic = "force-dynamic";

/** Published schemes. `?drafts=1` (admin) includes drafts. */
export async function GET(req: Request) {
  const drafts = new URL(req.url).searchParams.get("drafts") === "1";
  if (drafts && !adminAllowed(req)) return NextResponse.json({ error: "Admin token required" }, { status: 403 });
  try {
    return NextResponse.json({ schemes: await listSchemes(drafts) });
  } catch (e) {
    console.error("[schemes] list failed", e);
    return NextResponse.json({ schemes: [], error: "Schemes are temporarily unavailable." }, { status: 500 });
  }
}

/** Create or update a scheme (admin). Body: scheme fields; include `slug` to update an existing one. */
export async function POST(req: Request) {
  if (!adminAllowed(req)) return NextResponse.json({ error: "Admin token required" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const existing = typeof body.slug === "string" && body.slug ? await getScheme(body.slug) : null;
    const { scheme, errors } = validateScheme(body, existing);
    if (!scheme) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    if (!existing && (await getScheme(scheme.slug))) return NextResponse.json({ error: "A scheme with this name already exists." }, { status: 409 });
    await saveScheme(scheme);
    return NextResponse.json({ scheme });
  } catch (e) {
    console.error("[schemes] save failed", e);
    return NextResponse.json({ error: "Could not save. Check the database connection." }, { status: 500 });
  }
}
