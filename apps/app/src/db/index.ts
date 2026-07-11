import type { SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, { schema });

interface SqlExecutor {
	execute: (query: SQL) => Promise<unknown>;
}

/**
 * Run a raw SQL query and type its rows. Central home for the cast that
 * db.execute otherwise forces at every call site; the row shape is defined
 * by the query itself, so the type parameter is a promise the caller makes.
 */
export async function executeRows<T>(
	query: SQL,
	executor: SqlExecutor = db,
): Promise<T[]> {
	return (await executor.execute(query)) as T[];
}
