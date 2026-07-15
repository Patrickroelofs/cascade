import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

const client = postgres(env.DATABASE_URL, {
	// Backstop against runaway queries (e.g. a recursive CTE walking a cycle)
	// hanging a connection indefinitely.
	connection: { statement_timeout: 30_000 },
});
export const db = drizzle(client, { schema });
