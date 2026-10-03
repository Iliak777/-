/**
 * fetch() for the app's JSON endpoints that never throws: a dropped connection
 * comes back as `{ ok: false, status: 0 }`, so callers always reset their
 * loading state and can show a message.
 */
export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error?: string };

export async function api<T = Record<string, unknown>>(url: string, init?: { method?: string; body?: unknown }): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: init?.method ?? (init?.body === undefined ? "GET" : "POST"),
      headers: init?.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, status: res.status, data: data as T } : { ok: false, status: res.status, error: data?.error };
  } catch {
    return { ok: false, status: 0, error: "network" };
  }
}
