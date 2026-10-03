import { NextResponse } from "next/server";
import { currentCustomerId, endSession } from "@/lib/session";
import { deleteCustomerAccount } from "@/server/customer";

/** DELETE /api/account: erases the signed-in customer's personal data and signs out. */
export async function DELETE() {
  const customerId = await currentCustomerId();
  if (!customerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await deleteCustomerAccount(customerId);
  await endSession("customer");
  return NextResponse.json({ ok: true });
}
