import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
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
