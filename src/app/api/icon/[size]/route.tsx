import { appIcon } from "@/lib/app-icon";

const SIZES = new Set([32, 180, 192, 512]);

export async function GET(_req: Request, ctx: RouteContext<"/api/icon/[size]">) {
  const size = Number((await ctx.params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const res = appIcon(size);
  res.headers.set("Cache-Control", "public, max-age=86400");
  return res;
}
