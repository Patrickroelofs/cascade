import { formatCalendarDate } from "@cascade/outliner/calendar-date";
import type { DueDateRange } from "@cascade/outliner/node-filters";
import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
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
	// `mutation.isPending` only updates on the next render, so two `loadMore`
	// calls issued back-to-back (e.g. the virtualizer's threshold effect
	// re-firing before React commits the pending state) can both slip past
	// it and fetch the same cursor twice, duplicating rows. This ref is set
	// synchronously, closing that window.
	const isLoadingRef = useRef(false);

	const mutation = useMutation({
		mutationFn: () =>
			client.nodes.visibleTree({
				rootId,
				cursor: nextCursor,
				includeCollapsedDescendants,
				...(dueDateRange
					? {
							dueDateStart: formatCalendarDate(dueDateRange.start),
							dueDateEnd: formatCalendarDate(dueDateRange.end),
						}
					: {}),
			}),
		onSuccess: (next) => {
			queryClient.setQueryData(queryKey, (old: VisibleTreeData | undefined) =>
				old
					? { rows: [...old.rows, ...next.rows], nextCursor: next.nextCursor }
					: old,
			);
		},
	});

	return async () => {
		if (isLoadingRef.current || !nextCursor) return;
		isLoadingRef.current = true;
		try {
			await mutation.mutateAsync();
		} finally {
			isLoadingRef.current = false;
		}
	};
}
