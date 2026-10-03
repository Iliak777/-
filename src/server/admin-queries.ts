import "server-only";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { appointments, customers, services, staff, staffServices, timeOff, workingHours } from "@/db/schema";
import { currentAdminId } from "@/lib/session";
import { addDays, localToUtc } from "@/lib/time";
import { listServices } from "./catalog";
import { listThreads } from "./chat";

/**
 * Every admin read checks the session itself. A check in the admin layout alone
 * is not enough: pages and layouts render independently in the App Router.
 */
async function requireAdmin() {
  if (!(await currentAdminId())) throw new Error("Unauthorized");
}

export async function appointmentsOn(date: string) {
  await requireAdmin();
  return db
    .select({
      id: appointments.id,
      ref: appointments.ref,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      status: appointments.status,
      customerName: customers.name,
      phone: customers.phone,
      serviceName: services.name,
      staffName: staff.name,
    })
    .from(appointments)
    .innerJoin(customers, eq(customers.id, appointments.customerId))
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .innerJoin(staff, eq(staff.id, appointments.staffId))
    .where(and(gte(appointments.startsAt, localToUtc(date, 0)), lt(appointments.startsAt, localToUtc(addDays(date, 1), 0))))
    .orderBy(asc(appointments.startsAt), asc(staff.name));
}

export async function allServices() {
  await requireAdmin();
  return listServices({ activeOnly: false });
}

export async function serviceById(id: number) {
  await requireAdmin();
  const [row] = await db.select().from(services).where(eq(services.id, id));
  return row ?? null;
}

export async function allStaff() {
  await requireAdmin();
  return db.select().from(staff).orderBy(asc(staff.name));
}

export async function staffDetail(id: number) {
  await requireAdmin();
  const [row] = await db.select().from(staff).where(eq(staff.id, id));
  if (!row) return null;
  const [svcIds, hours, off] = await Promise.all([
    db.select({ serviceId: staffServices.serviceId }).from(staffServices).where(eq(staffServices.staffId, id)),
    db.select().from(workingHours).where(eq(workingHours.staffId, id)),
    db.select().from(timeOff).where(and(eq(timeOff.staffId, id), gte(timeOff.endsAt, new Date()))).orderBy(asc(timeOff.startsAt)),
  ]);
  return { ...row, serviceIds: svcIds.map((s) => s.serviceId), hours, timeOff: off };
}

export async function inboxThreads() {
  await requireAdmin();
  return listThreads();
}

export async function unreadThreadCount(): Promise<number> {
  return (await inboxThreads()).filter((t) => t.unread).length;
}
