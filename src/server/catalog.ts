import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, services } from "@/db/schema";

export async function listCategories() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
}

/** Services in menu order: by category, then within the category. */
export async function listServices({ activeOnly }: { activeOnly: boolean }) {
  const rows = await db
    .select({ service: services })
    .from(services)
    .leftJoin(categories, eq(categories.id, services.categoryId))
    .where(activeOnly ? eq(services.active, true) : undefined)
    .orderBy(asc(categories.sortOrder), asc(services.sortOrder), asc(services.id));
  return rows.map((r) => r.service);
}

export const listActiveServices = () => listServices({ activeOnly: true });
