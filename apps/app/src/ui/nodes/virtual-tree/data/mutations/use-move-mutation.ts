import {
	type MoveTarget,
	moveSubtree,
	patchRow,
} from "@cascade/outliner/visible-rows";
import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/orpc/client";
import { makeSetRows } from "../cache-helpers";

export function useMoveMutation(queryKey: QueryKey) {
	const queryClient = useQueryClient();
	const setRows = makeSetRows(queryClient, queryKey);

	const mutation = useMutation({
		mutationFn: async ({
			id,
			target,
			expandParentId,
		}: {
			id: string;
			target: MoveTarget;
			expandParentId?: string;
		}) => {
			await Promise.all([
				client.nodes.move(
					target.position === "append"
						? { id, parentId: target.parentId, position: "append" }
						: {
								id,
								parentId: target.parentId,
								position: target.position,
								targetId: target.targetId,
							},
				),
				expandParentId
					? client.nodes.toggleExpanded({ id: expandParentId, expanded: true })
					: null,
			]);
		},
		onMutate: async ({ id, target, expandParentId }) => {
			await queryClient.cancelQueries({ queryKey });
			setRows((rows) => {
				const expanded = expandParentId
					? patchRow(rows, expandParentId, { expanded: true })
					: rows;
				return moveSubtree(expanded, id, target);
			});
		},
		onSettled: () => {
			// Server-computed fractional order is authoritative; positions match,
			// so this reconciliation is invisible unless a concurrent edit raced us.
			queryClient.invalidateQueries({ queryKey });
		},
	});

	return (
		id: string,
		target: MoveTarget,
		moveOptions: { expandParentId?: string } = {},
	) =>
		mutation.mutateAsync({
			id,
			target,
			expandParentId: moveOptions.expandParentId,
		});
}
