import { drizzle } from "drizzle-orm/postgres-js";
import type { AnyPgTable } from "drizzle-orm/pg-core";
import postgres from "postgres";

type DrizzleInstance = ReturnType<typeof drizzle>;

let _db: DrizzleInstance | undefined;

export function initDb(schema: Record<string, AnyPgTable>): void {
	const client = postgres(process.env.DATABASE_URL!);
	_db = drizzle(client, { schema });
}

// ponytail: Proxy so existing `import { db } from "#/db"` call sites need no changes
export const db: DrizzleInstance = new Proxy({} as DrizzleInstance, {
	get(_, prop) {
		if (!_db) throw new Error("[cascade] db accessed before bootstrap()");
		return (_db as any)[prop];
	},
	has(_, prop) {
		return prop in (_db ?? {});
	},
});
