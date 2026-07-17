import type { AddNodeOptions } from "@cascade/outliner/tree-types";
import { appendRow, insertRowAfter } from "@cascade/outliner/visible-rows";
import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/orpc/client";
import { makeSetRows } from "../cache-helpers";
import type { VisibleTreeData } from "../types";

/**
 * Owns both "append as last child of root" (`add`) and "insert after a
 * sibling" (`addAfter`), since both just place a freshly created node into
 * the flat row array with the same visible-tree bookkeeping (depth/path).
 */
export function useCreateMutation(
	queryKey: QueryKey,
	rootId: string | null,
	rows: VisibleTreeData["rows"],
) {
	const queryClient = useQueryClient();
	const setRows = makeSetRows(queryClient, queryKey);

	const mutation = useMutation({
		mutationFn: (vars: {
			parentId: string | null;
			afterId?: string;
			dueDate?: Date | null;
		}) => client.nodes.create(vars),
	});

	const add = async ({ dueDate = null }: AddNodeOptions = {}) => {
		const created = await mutation.mutateAsync({ parentId: rootId, dueDate });
		setRows((currentRows) =>
			appendRow(currentRows, {
				id: created.id,
				parentId: created.parentId,
				content: created.content,
				type: created.type,
				metadata: created.metadata,
				expanded: created.expanded,
				order: created.order,
				dueDate: created.dueDate,
				tags: created.tags,
				depth: 0,
				path: [created.order],
				hasChildren: created.hasChildren,
				isLastChild: true,
			}),
		);
		return created.id;
	};

	const addAfter = async (afterId: string, addOptions: AddNodeOptions = {}) => {
		const { dueDate = null } = addOptions;
		const sibling = rows.find((r) => r.id === afterId);
		if (!sibling) return add(addOptions);
		const created = await mutation.mutateAsync({
			parentId: sibling.parentId,
			afterId,
			dueDate,
		});
		setRows((currentRows) =>
			insertRowAfter(currentRows, afterId, {
				id: created.id,
				parentId: created.parentId,
				content: created.content,
				type: created.type,
				metadata: created.metadata,
				expanded: created.expanded,
				order: created.order,
				dueDate: created.dueDate,
				tags: created.tags,
				depth: sibling.depth,
				path: [...sibling.path.slice(0, -1), created.order],
				hasChildren: created.hasChildren,
				isLastChild: sibling.isLastChild,
			}),
		);
		return created.id;
	};

	return { add, addAfter };
}
