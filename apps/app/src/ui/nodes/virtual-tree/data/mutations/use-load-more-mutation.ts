import { formatCalendarDate } from "@cascade/outliner/calendar-date";
import type { DueDateRange } from "@cascade/outliner/node-filters";
import type { QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/orpc/client";
import type { VisibleTreeData } from "../types";

export function useLoadMoreMutation(
	queryKey: QueryKey,
	rootId: string | null,
	includeCollapsedDescendants: boolean,
	dueDateRange: DueDateRange | null,
	nextCursor: string[] | null,
) {
	const queryClient = useQueryClient();
	const pageQueryKey = [...queryKey, "loadMore"];

	return async () => {
		if (!nextCursor) return;
		// Routed through fetchQuery (rather than a useMutation) so that two
		// loadMore() calls issued back-to-back — e.g. the virtualizer's
		// scroll-threshold effect re-firing before the previous page has
		// landed — dedupe on `pageQueryKey`: the second call awaits the
		// same in-flight request instead of firing another, so the append
		// below runs exactly once per page.
		await queryClient.fetchQuery({
			queryKey: pageQueryKey,
			queryFn: async () => {
				const next = await client.nodes.visibleTree({
					rootId,
					cursor: nextCursor,
					includeCollapsedDescendants,
					...(dueDateRange
						? {
								dueDateStart: formatCalendarDate(dueDateRange.start),
								dueDateEnd: formatCalendarDate(dueDateRange.end),
							}
						: {}),
				});
				queryClient.setQueryData(queryKey, (old: VisibleTreeData | undefined) =>
					old
						? { rows: [...old.rows, ...next.rows], nextCursor: next.nextCursor }
						: old,
				);
				return next;
			},
		});
	};
}
