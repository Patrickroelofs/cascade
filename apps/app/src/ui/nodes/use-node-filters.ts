import type { NodeFilters } from "@cascade/outliner/node-filters";
import { parseAsStringLiteral, useQueryStates } from "nuqs";

const filterParsers = {
	filter: parseAsStringLiteral(["today", "week"]),
};

/** Outliner filter state, synced to the URL so a filtered view is shareable/bookmarkable. */
export function useNodeFilters(): [
	NodeFilters,
	(filters: NodeFilters) => void,
] {
	const [{ filter }, setQueryFilters] = useQueryStates(filterParsers);

	return [
		{
			dueToday: filter === "today",
			dueThisWeek: filter === "week",
		},
		(filters) =>
			setQueryFilters({
				filter: filters.dueToday
					? "today"
					: filters.dueThisWeek
						? "week"
						: null,
			}),
	];
}
