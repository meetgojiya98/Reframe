import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let connectionString =
  process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "";

// Supabase (and most cloud Postgres) require SSL
if (connectionString && connectionString.includes("supabase.co") && !connectionString.includes("sslmode=")) {
  connectionString += connectionString.includes("?") ? "&sslmode=require" : "?sslmode=require";
}

const client = connectionString
  ? postgres(connectionString, { max: 1, prepare: false })
  : null;

export const db = client ? drizzle(client, { schema }) : null;

export type Db = NonNullable<typeof db>;
