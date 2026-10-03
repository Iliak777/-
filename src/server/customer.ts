import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { currentCustomerId } from "@/lib/session";

/** The signed-in customer, or null (also null if the account no longer exists). */
export async function currentCustomer() {
  const id = await currentCustomerId();
  if (!id) return null;
  const [row] = await db.select({ id: customers.id, name: customers.name, phone: customers.phone }).from(customers).where(eq(customers.id, id));
  return row ?? null;
}
