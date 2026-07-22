import { fileURLToPath } from "node:url";
import { isNotNull } from "drizzle-orm";
import { nodes } from "@/core/nodes/node.schema";
import { db } from "@/db";

export interface PurgeDeletedNodesResult {
	purgedIds: string[];
}

/** Permanently removes every currently soft-deleted node (`deletedAt` set —
 * see `deleteNode`). FK cascades (`node_versions`, `node_tags`) take their
 * rows with them, so this is the point a deleted node's history is actually
 * lost for good. Pass `dryRun` to report what would be purged without
 * deleting anything. */
export async function purgeDeletedNodes(
	dryRun = false,
): Promise<PurgeDeletedNodesResult> {
	const condition = isNotNull(nodes.deletedAt);

	if (dryRun) {
		const matches = await db
			.select({ id: nodes.id })
			.from(nodes)
			.where(condition);
		return { purgedIds: matches.map((row) => row.id) };
	}

	const purged = await db
		.delete(nodes)
		.where(condition)
		.returning({ id: nodes.id });
	return { purgedIds: purged.map((row) => row.id) };
}

async function main() {
	const dryRun = process.argv.includes("--dry-run");
	const { purgedIds } = await purgeDeletedNodes(dryRun);
	const prefix = dryRun ? "[dry run] Would purge" : "Purged";
	console.log(`${prefix} ${purgedIds.length} deleted node(s).`);
	process.exit(0);
}

// Only run as a CLI entrypoint (`pnpm db:purge-deleted`), not when imported by tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
