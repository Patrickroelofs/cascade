export interface NodeFilters {
	dueToday: boolean;
}

export const noFilters: NodeFilters = { dueToday: false };

export function hasActiveFilters(filters: NodeFilters): boolean {
	return filters.dueToday;
}
