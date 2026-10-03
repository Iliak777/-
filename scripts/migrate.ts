import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // Log the shape of the connection string (never the password) to make setup mistakes obvious.
  try {
    const u = new URL(url);
    console.log(`DB target: user=${decodeURIComponent(u.username)} host=${u.hostname} port=${u.port || "5432"} db=${u.pathname.slice(1)} passwordLength=${decodeURIComponent(u.password).length}`);
  } catch {
    console.error("DATABASE_URL is not a valid URL (check for stray spaces, brackets or special characters in the password).");
  }
  const client = postgres(url, { max: 1, onnotice: () => {}, prepare: false });
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  await client.end();
  console.log("Migrations applied.");
}

main().catch((e) => {
  // Print a readable message and let the process exit on its own, so piped
  // build logs are not cut off before the error is written.
  const cause = (e as { cause?: { message?: string; code?: string } })?.cause;
  console.error(`FAILED: ${e instanceof Error ? e.message : String(e)}`);
  if (cause) console.error(`CAUSE: ${cause.code ?? ""} ${cause.message ?? ""}`);
  process.exitCode = 1;
});
