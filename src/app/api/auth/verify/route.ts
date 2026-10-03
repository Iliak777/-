import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { startSession } from "@/lib/session";
import { verifyOtp } from "@/server/otp";

const Body = z.object({
  phone: z.string().max(40),
  code: z.string().regex(/^\d{6}$/),
  name: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  const phone = parsed.success ? normalizePhone(parsed.data.phone) : null;
  if (!parsed.success || !phone) return NextResponse.json({ error: "invalid_code" }, { status: 400 });

  const res = await verifyOtp(phone, parsed.data.code, parsed.data.name);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  await startSession("customer", res.customerId);
  return NextResponse.json({ ok: true });
}
