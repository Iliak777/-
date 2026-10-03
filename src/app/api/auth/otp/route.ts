import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { requestOtp } from "@/server/otp";

const Body = z.object({ phone: z.string().max(40) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  const phone = parsed.success ? normalizePhone(parsed.data.phone) : null;
  if (!phone) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });

  const res = await requestOtp(phone);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 429 });
  return NextResponse.json({ phone, devCode: res.devCode });
}
