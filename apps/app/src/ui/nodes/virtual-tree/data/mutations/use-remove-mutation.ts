import type {
	TypedMetadata,
	VisibleNodeRow,
} from "@cascade/outliner/node-types";
import {
	captureCurrentPosition,
	insertSubtreeAt,
	type MoveTarget,
	removeSubtree,
} from "@cascade/outliner/visible-rows";
import { toast } from "@cascade/ui/toast";
import type { QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { m } from "#/paraglide/messages.js";
import { client } from "@/orpc/client";
import { undoStore } from "@/ui/undo/undo-store";
import { makeSetRows } from "../cache-helpers";
import { fetchFullSubtree } from "../fetch-full-subtree";
import type { VisibleTreeData } from "../types";

interface DeleteSnapshot {
	row: VisibleNodeRow;
	descendants: VisibleNodeRow[];
	target: MoveTarget;
}

function toSnapshotInput(row: VisibleNodeRow) {
	return {
		id: row.id,
		content: row.content as { root: unknown } | null,
		expanded: row.expanded,
		dueDate: row.dueDate,
		tags: row.tags,
		...({ type: row.type, metadata: row.metadata } as TypedMetadata),
	};
}

function toRestoreInput({ row, descendants, target }: DeleteSnapshot) {
	return {
		parentId: target.parentId,
		target:
			target.position === "append"
				? { position: "append" as const }
				: { position: target.position, targetId: target.targetId },
		root: toSnapshotInput(row),
		descendants: descendants.map((d) => ({
			...toSnapshotInput(d),
			parentId: d.parentId as string,
			order: d.order,
		})),
	};
}

export function useRemoveMutation(queryKey: QueryKey) {
	const queryClient = useQueryClient();
	const setRows = makeSetRows(queryClient, queryKey);

	const rawDelete = async (id: string) => {
		await queryClient.cancelQueries({ queryKey });
		setRows((rows) => removeSubtree(rows, id));
		try {
			const { childrenDeleted } = await client.nodes.delete({ id });
			toast.success(
				childrenDeleted > 64
					? m.node_deleted_with_many_children()
					: childrenDeleted > 0
						? m.node_deleted_with_children({ count: childrenDeleted })
						: m.node_deleted(),
			);
		} catch {
			toast.error(m.node_delete_failed());
			queryClient.invalidateQueries({ queryKey });
		}
	};

	const rawRestore = async (snapshot: DeleteSnapshot) => {
		await queryClient.cancelQueries({ queryKey });
		setRows((rows) =>
			insertSubtreeAt(
				rows,
				snapshot.row,
				snapshot.descendants,
				snapshot.target,
			),
		);
		try {
			await client.nodes.restore(toRestoreInput(snapshot));
		} catch {
			toast.error(m.undo_restore_failed());
			queryClient.invalidateQueries({ queryKey });
		}
	};

	return (id: string) => {
		const rows = queryClient.getQueryData<VisibleTreeData>(queryKey)?.rows;
		const row = rows?.find((r) => r.id === id);
		const target = rows && captureCurrentPosition(rows, id);
		if (!row || !target) return;

		const run = async () => {
			// Fetched before the actual delete request goes out (the optimistic
			// cache patch inside rawDelete doesn't touch the server), so this
			// always sees the subtree that's about to be deleted, collapsed
			// descendants included, never a partial post-delete result.
			const descendants = row.hasChildren
				? await fetchFullSubtree(id, { includeCollapsedDescendants: true })
				: [];
			await rawDelete(id);
			undoStore.push({
				undo: () => rawRestore({ row, descendants, target }),
				redo: () => rawDelete(id),
			});
		};
		run();
	};
}
