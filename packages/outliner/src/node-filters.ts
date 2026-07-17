export interface NodeFilters {
	dueToday: boolean;
	dueThisWeek: boolean;
}

export const noFilters: NodeFilters = { dueToday: false, dueThisWeek: false };

export function hasActiveFilters(filters: NodeFilters): boolean {
	return filters.dueToday || filters.dueThisWeek;
}
