"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { adminUsers, appointments, services, staff, staffServices, timeOff, workingHours } from "@/db/schema";
import { hasLocale } from "@/i18n/config";
import { verifyPassword } from "@/lib/password";
import { currentAdminId, endSession, startSession } from "@/lib/session";
import { hhmmToMinutes, isValidDateString, localToUtc } from "@/lib/time";

async function requireAdmin() {
  const id = await currentAdminId();
  if (!id) throw new Error("Unauthorized");
  return id;
}

function localeOf(form: FormData) {
  const l = String(form.get("locale") ?? "en");
  return hasLocale(l) ? l : "en";
}

export async function adminLogin(_prev: { error?: boolean } | undefined, form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
  // Always run the hash check so response time does not reveal which emails exist.
  const ok = await verifyPassword(password, user?.passwordHash ?? "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86));
  if (!user || !ok) return { error: true };
  await startSession("admin", String(user.id));
  redirect(`/${localeOf(form)}/admin`);
}

export async function adminLogout(form: FormData) {
  await endSession("admin");
  redirect(`/${localeOf(form)}/admin/login`);
}

const StatusForm = z.object({
  id: z.uuid(),
  status: z.enum(["confirmed", "cancelled", "completed", "no_show"]),
});

export async function setAppointmentStatus(form: FormData) {
  await requireAdmin();
  const { id, status } = StatusForm.parse(Object.fromEntries(form));
  await db.update(appointments).set({ status }).where(eq(appointments.id, id));
  revalidatePath("/[locale]/admin", "page");
}

const ServiceForm = z.object({
  id: z.coerce.number().int().optional(),
  nameEn: z.string().trim().min(1).max(120),
  nameTh: z.string().trim().max(120),
  nameZh: z.string().trim().max(120),
  descEn: z.string().trim().max(500),
  descTh: z.string().trim().max(500),
  descZh: z.string().trim().max(500),
  categoryId: z.string(),
  durationMin: z.coerce.number().int().min(5).max(600),
  priceThb: z.string().trim(),
  sortOrder: z.coerce.number().int().default(0),
});

export async function saveService(form: FormData) {
  await requireAdmin();
  const f = ServiceForm.parse(Object.fromEntries(form));
  const price = f.priceThb === "" ? null : Number(f.priceThb);
  if (price !== null && (!Number.isInteger(price) || price < 0)) throw new Error("Invalid price");
  const values = {
    name: { en: f.nameEn, th: f.nameTh, zh: f.nameZh },
    description: { en: f.descEn, th: f.descTh, zh: f.descZh },
    categoryId: f.categoryId ? Number(f.categoryId) : null,
    durationMin: f.durationMin,
    priceThb: price,
    sortOrder: f.sortOrder,
    active: form.get("active") === "on",
  };
  if (f.id) await db.update(services).set(values).where(eq(services.id, f.id));
  else await db.insert(services).values(values);
  revalidatePath("/[locale]", "layout");
  redirect(`/${localeOf(form)}/admin/services`);
}

const StaffForm = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(1).max(80),
});

export async function saveStaff(form: FormData) {
  await requireAdmin();
  const f = StaffForm.parse({ id: form.get("id") || undefined, name: form.get("name") });
  const serviceIds = form.getAll("serviceIds").map(Number).filter(Number.isInteger);

  const hours: { weekday: number; startMin: number; endMin: number }[] = [];
  for (let d = 0; d < 7; d++) {
    const start = String(form.get(`start_${d}`) ?? "");
    const end = String(form.get(`end_${d}`) ?? "");
    if (!start && !end) continue;
    const s = hhmmToMinutes(start);
    const e = hhmmToMinutes(end);
    if (s === null || e === null || e <= s) throw new Error(`Invalid hours for weekday ${d}`);
    hours.push({ weekday: d, startMin: s, endMin: e });
  }

  await db.transaction(async (tx) => {
    let staffId = f.id;
    const active = form.get("active") === "on";
    if (staffId) await tx.update(staff).set({ name: f.name, active }).where(eq(staff.id, staffId));
    else [{ id: staffId }] = await tx.insert(staff).values({ name: f.name, active }).returning({ id: staff.id });
    await tx.delete(staffServices).where(eq(staffServices.staffId, staffId!));
    if (serviceIds.length) await tx.insert(staffServices).values(serviceIds.map((serviceId) => ({ staffId: staffId!, serviceId })));
    await tx.delete(workingHours).where(eq(workingHours.staffId, staffId!));
    if (hours.length) await tx.insert(workingHours).values(hours.map((h) => ({ ...h, staffId: staffId! })));
  });
  redirect(`/${localeOf(form)}/admin/staff`);
}

const TimeOffForm = z.object({
  staffId: z.coerce.number().int(),
  fromDate: z.string().refine(isValidDateString),
  fromTime: z.string(),
  toDate: z.string().refine(isValidDateString),
  toTime: z.string(),
  note: z.string().max(200).optional(),
});

export async function addTimeOff(form: FormData) {
  await requireAdmin();
  const f = TimeOffForm.parse(Object.fromEntries(form));
  const from = hhmmToMinutes(f.fromTime || "00:00");
  const to = hhmmToMinutes(f.toTime || "24:00");
  if (from === null || to === null) throw new Error("Invalid time");
  const startsAt = localToUtc(f.fromDate, from);
  const endsAt = localToUtc(f.toDate, to);
  if (endsAt <= startsAt) throw new Error("End must be after start");
  await db.insert(timeOff).values({ staffId: f.staffId, startsAt, endsAt, note: f.note || null });
  revalidatePath("/[locale]/admin/staff/[id]", "page");
}

export async function removeTimeOff(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  const staffId = Number(form.get("staffId"));
  await db.delete(timeOff).where(and(eq(timeOff.id, id), eq(timeOff.staffId, staffId)));
  revalidatePath("/[locale]/admin/staff/[id]", "page");
}
