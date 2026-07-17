import type { NodeFilters } from "@cascade/outliner/node-filters";
import { parseAsArrayOf, parseAsStringLiteral, useQueryStates } from "nuqs";

const filterParsers = {
	filter: parseAsArrayOf(parseAsStringLiteral(["today", "week"])),
};

/** Outliner filter state, synced to the URL so a filtered view is shareable/bookmarkable. */
export function useNodeFilters(): [
	NodeFilters,
	(filters: NodeFilters) => void,
] {
	const [{ filter }, setQueryFilters] = useQueryStates(filterParsers);

	return [
		{
			dueToday: filter?.includes("today") ?? false,
			dueThisWeek: filter?.includes("week") ?? false,
		},
		(filters) => {
			const next = [
				...(filters.dueToday ? (["today"] as const) : []),
				...(filters.dueThisWeek ? (["week"] as const) : []),
			];
			setQueryFilters({ filter: next.length > 0 ? next : null });
		},
	];
}
