import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { appSecret } from "./secret";

type Role = "customer" | "admin";

const COOKIES: Record<Role, { name: string; maxAgeSec: number }> = {
  customer: { name: "kl_session", maxAgeSec: 60 * 60 * 24 * 30 }, // 30 days
  admin: { name: "kl_admin", maxAgeSec: 60 * 60 * 12 }, // 12 hours
};

function key() {
  return new TextEncoder().encode(appSecret());
}

export async function signSession(role: Role, subject: string): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(`${COOKIES[role].maxAgeSec}s`)
    .sign(key());
}

export async function verifySession(role: Role, token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload.role === role && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function startSession(role: Role, subject: string) {
  const store = await cookies();
  store.set(COOKIES[role].name, await signSession(role, subject), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIES[role].maxAgeSec,
  });
}

export async function endSession(role: Role) {
  (await cookies()).delete(COOKIES[role].name);
}

/** The signed-in customer's id, or null. */
export async function currentCustomerId(): Promise<string | null> {
  return verifySession("customer", (await cookies()).get(COOKIES.customer.name)?.value);
}

/** The signed-in admin's id, or null. */
export async function currentAdminId(): Promise<number | null> {
  const sub = await verifySession("admin", (await cookies()).get(COOKIES.admin.name)?.value);
  return sub ? Number(sub) : null;
}
