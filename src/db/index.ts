// Postgres via postgres.js. Works with Supabase's pooled connection string
// (Supavisor, transaction mode) and with any other Postgres. prepare:false is
// required in transaction pooling mode.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Run `vercel env pull .env.local` after linking Supabase.");

const client = postgres(url, { prepare: false, max: 5 });
export const db = drizzle(client, { schema });
export { schema };
