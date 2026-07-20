import { parseArgs } from "node:util";
import { cliArgs } from "./support/cli-args";
import { createPerfClient } from "./support/http-client";
import {
	type LatencySample,
	printSummary,
	summarize,
	time,
	writeResultsFile,
} from "./support/stats";

const { values } = parseArgs({
	args: cliArgs(),
	options: {
		// How many visibleTree pages to walk via cursor pagination, simulating
		// scrolling/loading further down a large tree.
		pages: { type: "string", default: "20" },
		// Page size passed to visibleTree, same default the app itself uses.
		limit: { type: "string", default: "500" },
		// Untimed visibleTree calls to make before sampling, so the very first
		// hit to the route after a fresh server start (module load, DB pool
		// connection, query planner) doesn't get counted as steady-state latency.
		warmup: { type: "string", default: "3" },
	},
});

const pages = Number.parseInt(values.pages, 10);
const limit = Number.parseInt(values.limit, 10);
const warmup = Number.parseInt(values.warmup, 10);

async function main() {
	const client = await createPerfClient();

	// A server that just started pays one-time costs on its first request to
	// a given route — lazy module/chunk loading, establishing the DB
	// connection pool, cold query planning — that have nothing to do with the
	// code being benchmarked. Without this, that cost lands on whichever
	// sample happens to go first and skews the percentiles (seen as a
	// misleading multi-hundred-percent regression in an otherwise-unrelated
	// PR). Warm the path with a few untimed calls before sampling.
	if (warmup > 0) {
		console.log(`Warming up with ${warmup} untimed visibleTree call(s)...`);
		for (let i = 0; i < warmup; i++) {
			await client.nodes.visibleTree({
				rootId: null,
				cursor: null,
				includeCollapsedDescendants: true,
				limit,
			});
		}
	}

	console.log(`Walking up to ${pages} visibleTree page(s) at limit=${limit}...`);
	const visibleTreeSamples: LatencySample[] = [];
	let cursor: string[] | null = null;

	for (let page = 0; page < pages; page++) {
		const outcome = await time(() =>
			client.nodes.visibleTree({
				rootId: null,
				cursor,
				includeCollapsedDescendants: true,
				limit,
			}),
		);
		visibleTreeSamples.push({ ok: outcome.ok, ms: outcome.ms });
		if (!outcome.ok) {
			console.error(`visibleTree page ${page} failed:`, outcome.error);
			break;
		}
		const { nextCursor } = outcome.result;
		if (!nextCursor) break;
		cursor = nextCursor;
	}

	const visibleTreeSummary = summarize(visibleTreeSamples);
	printSummary("visibleTree", visibleTreeSummary);

	const outPath = await writeResultsFile("query-bench.json", {
		timestamp: new Date().toISOString(),
		params: { pages, limit, warmup },
		visibleTree: visibleTreeSummary,
	});
	console.log(`Wrote results to ${outPath}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
