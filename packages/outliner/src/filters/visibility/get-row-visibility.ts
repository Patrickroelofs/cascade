import type { VisibleNodeRow } from "../../nodes/model/node-types";
import { hasActiveFilters, type NodeFilters } from "../model/node-filters";
import { rowMatchesFilters } from "./row-filter-match";
import {
	getCollapsedDescendantIds,
	getCompletedSubtreeIds,
	getMatchDescendantIds,
} from "./subtree-visibility";

export interface RowVisibility {
	/** Row ids to hide entirely: not a match, and not on the path to one. */
	hiddenIds: Set<string>;
	/** Row ids to keep visible but dimmed: a match's ancestors or descendants. */
	contextIds: Set<string>;
}

const emptyVisibility: RowVisibility = {
	hiddenIds: new Set(),
	contextIds: new Set(),
};

/**
 * Resolves filtering without changing the flat row array, preserving tree
 * depth and contiguous-subtree semantics for keyboard and drag operations.
 */
export function getRowVisibility(
	rows: VisibleNodeRow[],
	filters: NodeFilters,
): RowVisibility {
	if (!hasActiveFilters(filters)) return emptyVisibility;

	const excludedIds = filters.hideCompleted
		? getCompletedSubtreeIds(rows)
		: new Set<string>();

	if (!hasPositiveFilters(filters)) {
		return { hiddenIds: excludedIds, contextIds: new Set() };
	}

	const candidates = rows.filter((row) => !excludedIds.has(row.id));
	const parentById = new Map(candidates.map((row) => [row.id, row.parentId]));
	const matchIds = new Set(
		candidates
			.filter((row) => rowMatchesFilters(row, filters))
			.map((row) => row.id),
	);
	const collapsedIds = getCollapsedDescendantIds(candidates);
	const contextIds = collectContextIds(candidates, matchIds, parentById);

	const hiddenIds = new Set(
		rows
			.filter(
				(row) =>
					collapsedIds.has(row.id) ||
					(!matchIds.has(row.id) && !contextIds.has(row.id)),
			)
			.map((row) => row.id),
	);

	return { hiddenIds, contextIds };
}

function hasPositiveFilters(filters: NodeFilters): boolean {
	return !(
		filters.tags.length === 0 &&
		!filters.dueToday &&
		!filters.dueThisWeek &&
		!filters.dueOnDate &&
		!filters.dueDateRange
	);
}

function collectContextIds(
	rows: VisibleNodeRow[],
	matchIds: Set<string>,
	parentById: Map<string, string | null>,
): Set<string> {
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

	for (const id of getMatchDescendantIds(rows, matchIds)) {
		if (!matchIds.has(id)) contextIds.add(id);
	}

	return contextIds;
}
