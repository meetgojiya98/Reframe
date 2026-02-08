import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let connectionString =
  process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "";

// Supabase and most cloud Postgres require SSL (direct db.*.supabase.co and pooler *.supabase.com)
const needsSsl =
  connectionString &&
  (connectionString.includes("supabase.co") || connectionString.includes("supabase.com")) &&
  !connectionString.includes("sslmode=");
if (needsSsl) {
  connectionString += connectionString!.includes("?") ? "&sslmode=require" : "?sslmode=require";
}

const isSupabase =
  connectionString &&
  (connectionString.includes("supabase.co") || connectionString.includes("supabase.com"));

const client = connectionString
  ? postgres(connectionString, {
      max: 1,
      prepare: false,
      ...(isSupabase ? { ssl: "require" as const } : {})
    })
  : null;

export const db = client ? drizzle(client, { schema }) : null;

export type Db = NonNullable<typeof db>;
