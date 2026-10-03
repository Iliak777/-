import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { appointments, chatThreads, customers, otpCodes } from "@/db/schema";
import { currentCustomerId } from "@/lib/session";

/** Prefix of the placeholder phone a deleted account keeps (the column is unique and required). */
export const DELETED_PHONE_PREFIX = "deleted:";

/** The signed-in customer, or null (also null if the account no longer exists). */
export async function currentCustomer() {
  const id = await currentCustomerId();
  if (!id) return null;
  const [row] = await db.select({ id: customers.id, name: customers.name, phone: customers.phone }).from(customers).where(eq(customers.id, id));
  return row && !row.phone.startsWith(DELETED_PHONE_PREFIX) ? row : null;
}

/**
 * Deletes a customer's personal data at their request (App Store rule, Thai PDPA).
 * Upcoming bookings are cancelled and the chat is deleted. Past appointments stay
 * in the clinic's records, but no longer point to a name or phone number.
 */
export async function deleteCustomerAccount(customerId: string, now = new Date()) {
  await db.transaction(async (tx) => {
    const [row] = await tx.select({ phone: customers.phone }).from(customers).where(eq(customers.id, customerId));
    if (!row) return;
    await tx
      .update(appointments)
      .set({ status: "cancelled" })
      .where(and(eq(appointments.customerId, customerId), eq(appointments.status, "confirmed"), gt(appointments.startsAt, now)));
    await tx.delete(chatThreads).where(eq(chatThreads.customerId, customerId)); // cascades to messages
    await tx.delete(otpCodes).where(eq(otpCodes.phone, row.phone));
    await tx.update(customers).set({ name: "Deleted customer", phone: `${DELETED_PHONE_PREFIX}${customerId}` }).where(eq(customers.id, customerId));
  });
}
