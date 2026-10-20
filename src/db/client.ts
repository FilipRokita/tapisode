import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/config/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

/** One connection pool per server instance. `prepare: false` keeps it compatible with a pooled connection string. */
const sql = (globalForDb.sql ??= postgres(getEnv().DATABASE_URL, { prepare: false, max: 5 }));

export const db = drizzle(sql, { schema });
export type Db = typeof db;
