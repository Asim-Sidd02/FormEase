import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, getUser, readSessionToken } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const email = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  const user = email ? await getUser(email) : null;
  return NextResponse.json({ user });
}
