import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Mirrors vitest.integration.config.ts; global setup runs in the main
// process where the config's test.env has not been applied yet.
const DATABASE_URL =
	process.env.DATABASE_URL ??
	"postgres://postgres:postgres@localhost:5432/cascade_test";

export default async function setup() {
	const connection = postgres(DATABASE_URL, { max: 1 });
	try {
		await migrate(drizzle(connection), { migrationsFolder: "./drizzle" });
	} finally {
		await connection.end();
	}
}
