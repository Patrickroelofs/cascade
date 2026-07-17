import { patchRow } from "@cascade/outliner/visible-rows";
import type { QueryKey } from "@tanstack/react-query";
import { client } from "@/orpc/client";
import { useOptimisticNodeMutation } from "@/ui/nodes/use-optimistic-node-mutation";
import { patchRows } from "../cache-helpers";
import type { VisibleTreeData } from "../types";

export function useSetDueDateMutation(queryKey: QueryKey) {
	const mutation = useOptimisticNodeMutation<
		{ id: string; dueDate: Date | null },
		void,
		VisibleTreeData
	>({
		queryKey,
		mutationFn: (vars) => client.nodes.setDueDate(vars),
		patch: (old, { id, dueDate }) =>
			patchRows((rows) => patchRow(rows, id, { dueDate }), old),
	});

	return (id: string, dueDate: Date | null) => mutation.mutate({ id, dueDate });
}
