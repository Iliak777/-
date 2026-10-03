import { NextResponse } from "next/server";
import { endSession } from "@/lib/session";

export async function POST() {
  await endSession("customer");
  return NextResponse.json({ ok: true });
}
