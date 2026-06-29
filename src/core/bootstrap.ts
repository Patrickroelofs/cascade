import type { AnyPgTable } from "drizzle-orm/pg-core";
import { initDb } from "#/db";
import config from "../../cascade.config";

let bootstrapped = false;

/**
 * Resolve feature thunks, initialize the database, and run onInit hooks.
 * Safe to call multiple times — only executes once.
 * Call this at server startup before handling requests.
 */
export async function bootstrap(): Promise<void> {
	if (bootstrapped) return;
	bootstrapped = true;

	const combinedSchema: Record<string, AnyPgTable> = {};

	for (const feature of config.features) {
		if (import.meta.env.SSR) {
			if (feature.schema) {
				feature._resolvedSchema = await feature.schema();
				Object.assign(combinedSchema, feature._resolvedSchema);
			}
			if (feature.procedures) {
				feature._resolvedProcedures = await feature.procedures();
			}
		}
		await feature.hooks?.onInit?.(config);
	}

	if (import.meta.env.SSR) {
		initDb(combinedSchema);
	}
}
