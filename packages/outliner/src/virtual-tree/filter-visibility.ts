import { dueBucket } from "../due-date-bucket";
import type { NodeFilters } from "../node-filters";
import type { VisibleNodeRow } from "../node-types";

export interface RowVisibility {
	/** Row ids to hide entirely: neither a match nor an ancestor of one. */
	hiddenIds: Set<string>;
	/** Row ids to keep visible but dimmed: not a match, but on the path to one. */
	contextIds: Set<string>;
	matchCount: number;
}

const emptyVisibility: RowVisibility = {
	hiddenIds: new Set(),
	contextIds: new Set(),
	matchCount: 0,
};

/**
 * Resolves which rows an active filter set hides. Matches and their full
 * ancestor chain stay in the array at their original depth, so indent,
 * outdent, and drag-and-drop keep operating on the same contiguous rows
 * they always have; only rendering treats hidden/context rows differently.
 */
export function getRowVisibility(
	rows: VisibleNodeRow[],
	filters: NodeFilters,
): RowVisibility {
	if (!filters.dueToday) return emptyVisibility;

	const parentById = new Map(rows.map((row) => [row.id, row.parentId]));
	const matchIds = new Set(
		rows
			.filter((row) => {
				if (!row.dueDate) return false;
				const completed =
					row.type === "task" && (row.metadata?.completed ?? false);
				return dueBucket(new Date(row.dueDate), completed) === "today";
			})
			.map((row) => row.id),
	);

	const contextIds = new Set<string>();
	for (const id of matchIds) {
		let parentId = parentById.get(id) ?? null;
		while (
			parentId !== null &&
			!matchIds.has(parentId) &&
			!contextIds.has(parentId)
		) {
			contextIds.add(parentId);
			parentId = parentById.get(parentId) ?? null;
		}
	}

	const hiddenIds = new Set(
		rows
			.filter((row) => !matchIds.has(row.id) && !contextIds.has(row.id))
			.map((row) => row.id),
	);

	return { hiddenIds, contextIds, matchCount: matchIds.size };
}
