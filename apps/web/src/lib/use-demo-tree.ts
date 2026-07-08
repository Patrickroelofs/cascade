import { toast } from "@cascade/ui/toast";
import type { VisibleNodeRow } from "@cascade/ui/tree/node-types";
import type { VisibleTree } from "@cascade/ui/tree/tree-types";
import {
	appendRow,
	collapseNode,
	expandNode,
	insertRowAfter,
	moveSubtree,
	patchRow,
	removeSubtree,
} from "@cascade/ui/tree/visible-rows";
import { useState } from "react";
import { demoInitialRows, demoSubtreeCache } from "./demo-seed";

function newRow(
	partial: Pick<VisibleNodeRow, "parentId" | "depth" | "isLastChild">,
) {
	const id = crypto.randomUUID();
	const row: VisibleNodeRow = {
		id,
		content: null,
		type: "text",
		metadata: null,
		expanded: false,
		order: id,
		path: [],
		hasChildren: false,
		...partial,
	};
	return row;
}

/**
 * In-memory stand-in for apps/app's use-visible-tree.ts: same VisibleTree
 * contract and the same pure splice helpers, but mutating local state
 * instead of an oRPC-backed query cache. Nothing here persists or hits a
 * network.
 */
export function useDemoTree(): VisibleTree {
	const [rows, setRows] = useState<VisibleNodeRow[]>(demoInitialRows);

	const toggle: VisibleTree["toggle"] = (
		id,
		expanded,
		commit = (splice) => splice(),
	) => {
		commit(() =>
			setRows((current) =>
				expanded
					? expandNode(current, id, demoSubtreeCache.get(id) ?? [])
					: collapseNode(current, id),
			),
		);
	};

	const move: VisibleTree["move"] = (id, target, options = {}) => {
		setRows((current) => {
			const withExpandedParent = options.expandParentId
				? patchRow(current, options.expandParentId, { expanded: true })
				: current;
			return moveSubtree(withExpandedParent, id, target);
		});
	};

	const remove: VisibleTree["remove"] = (id, commit = (splice) => splice()) => {
		commit(() => setRows((current) => removeSubtree(current, id)));
		toast.success("Node deleted");
	};

	const updateContent: VisibleTree["updateContent"] = (id, content) => {
		setRows((current) => patchRow(current, id, { content }));
	};

	const setType: VisibleTree["setType"] = (id, typed) => {
		setRows((current) =>
			patchRow(current, id, { type: typed.type, metadata: typed.metadata }),
		);
	};

	const add: VisibleTree["add"] = async (commit = (splice) => splice()) => {
		const created = newRow({ parentId: null, depth: 0, isLastChild: true });
		commit(() => setRows((current) => appendRow(current, created)));
		return created.id;
	};

	const addAfter: VisibleTree["addAfter"] = async (
		afterId,
		commit = (splice) => splice(),
	) => {
		const sibling = rows.find((r) => r.id === afterId);
		if (!sibling) return add(commit);
		const created = newRow({
			parentId: sibling.parentId,
			depth: sibling.depth,
			isLastChild: sibling.isLastChild,
		});
		commit(() =>
			setRows((current) => insertRowAfter(current, afterId, created)),
		);
		return created.id;
	};

	return {
		rows,
		hasMore: false,
		toggle,
		move,
		remove,
		updateContent,
		setType,
		add,
		addAfter,
		loadMore: () => {},
	};
}
