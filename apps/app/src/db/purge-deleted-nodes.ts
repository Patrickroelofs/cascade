import { fileURLToPath } from "node:url";
import { and, isNotNull, lt } from "drizzle-orm";
import { nodes } from "@/core/nodes/node.schema";
import { db } from "@/db";

export const DEFAULT_RETENTION_DAYS = 30;

export interface PurgeDeletedNodesResult {
	cutoff: Date;
	purgedIds: string[];
}

/** Permanently removes nodes soft-deleted (`deletedAt`) more than
 * `retentionDays` ago. FK cascades (`node_versions`, `node_tags`) take their
 * rows with them, so this is the point a deleted node's history is actually
 * lost for good. Pass `dryRun` to report what would be purged without
 * deleting anything. */
export async function purgeDeletedNodes(
	retentionDays: number = DEFAULT_RETENTION_DAYS,
	dryRun = false,
): Promise<PurgeDeletedNodesResult> {
	const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
	const condition = and(
		isNotNull(nodes.deletedAt),
		lt(nodes.deletedAt, cutoff),
	);

	if (dryRun) {
		const matches = await db
			.select({ id: nodes.id })
			.from(nodes)
			.where(condition);
		return { cutoff, purgedIds: matches.map((row) => row.id) };
	}

	const purged = await db
		.delete(nodes)
		.where(condition)
		.returning({ id: nodes.id });
	return { cutoff, purgedIds: purged.map((row) => row.id) };
}

function parseArgs() {
	const daysArg = process.argv.find((arg) => arg.startsWith("--days="));
	const days = daysArg
		? Number.parseInt(daysArg.slice("--days=".length), 10)
		: DEFAULT_RETENTION_DAYS;
	return {
		retentionDays:
			Number.isFinite(days) && days > 0 ? days : DEFAULT_RETENTION_DAYS,
		dryRun: process.argv.includes("--dry-run"),
	};
}

async function main() {
	const { retentionDays, dryRun } = parseArgs();
	const { cutoff, purgedIds } = await purgeDeletedNodes(retentionDays, dryRun);
	const prefix = dryRun ? "[dry run] Would purge" : "Purged";
	console.log(
		`${prefix} ${purgedIds.length} node(s) soft-deleted before ${cutoff.toISOString()} (retention: ${retentionDays}d).`,
	);
	process.exit(0);
}

// Only run as a CLI entrypoint (`pnpm db:purge-deleted`), not when imported by tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
