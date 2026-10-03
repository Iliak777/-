import "server-only";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { appointments, customers, services, staff, staffServices, timeOff, workingHours } from "@/db/schema";
import { addDays, localToUtc } from "@/lib/time";
import { listServices } from "./catalog";

export async function appointmentsOn(date: string) {
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

export const allServices = () => listServices({ activeOnly: false });

export async function allStaff() {
  return db.select().from(staff).orderBy(asc(staff.name));
}

export async function staffDetail(id: number) {
  const [row] = await db.select().from(staff).where(eq(staff.id, id));
  if (!row) return null;
  const [svcIds, hours, off] = await Promise.all([
    db.select({ serviceId: staffServices.serviceId }).from(staffServices).where(eq(staffServices.staffId, id)),
    db.select().from(workingHours).where(eq(workingHours.staffId, id)),
    db.select().from(timeOff).where(and(eq(timeOff.staffId, id), gte(timeOff.endsAt, new Date()))).orderBy(asc(timeOff.startsAt)),
  ]);
  return { ...row, serviceIds: svcIds.map((s) => s.serviceId), hours, timeOff: off };
}
