import type { NodeTypeName, VisibleNodeRow } from "@cascade/ui/tree/node-types";

interface SeedNode {
	id: string;
	type?: NodeTypeName;
	text: string;
	completed?: boolean;
	expanded?: boolean;
	children?: SeedNode[];
}

function lexicalContent(text: string) {
	return {
		root: {
			type: "root",
			children: [{ type: "paragraph", children: [{ type: "text", text }] }],
		},
	};
}

function toRow(
	node: SeedNode,
	parentId: string | null,
	depth: number,
	order: number,
	isLastChild: boolean,
): VisibleNodeRow {
	const type = node.type ?? "text";
	return {
		id: node.id,
		parentId,
		content: lexicalContent(node.text),
		type,
		metadata: type === "task" ? { completed: node.completed ?? false } : null,
		expanded: node.expanded ?? true,
		order: String(order),
		depth,
		path: [],
		hasChildren: (node.children?.length ?? 0) > 0,
		isLastChild,
	};
}

/** Depth-first visible rows for a sibling group, skipping collapsed subtrees. */
function collectVisible(
	nodes: SeedNode[],
	parentId: string | null,
	depth: number,
): VisibleNodeRow[] {
	const rows: VisibleNodeRow[] = [];
	nodes.forEach((node, index) => {
		rows.push(toRow(node, parentId, depth, index, index === nodes.length - 1));
		if ((node.expanded ?? true) && node.children?.length) {
			rows.push(...collectVisible(node.children, node.id, depth + 1));
		}
	});
	return rows;
}

/**
 * Descendant rows for every node with children, depth-relative to that node
 * (as a real `visibleTree({ rootId: id })` call would return), so expanding a
 * collapsed node can splice its subtree in without an actual fetch.
 */
function collectSubtreeCache(
	nodes: SeedNode[],
	cache: Map<string, VisibleNodeRow[]>,
): void {
	for (const node of nodes) {
		if (node.children?.length) {
			cache.set(node.id, collectVisible(node.children, node.id, 0));
			collectSubtreeCache(node.children, cache);
		}
	}
}

const demoSeedTree: SeedNode[] = [
	{
		id: "welcome",
		text: "Welcome to Cascade — this outline is fully interactive",
		children: [
			{ id: "welcome-1", text: "Click any line to edit it" },
			{ id: "welcome-2", text: "Press Tab / Shift+Tab to indent and outdent" },
			{ id: "welcome-3", text: "Press Enter to add a new line below" },
			{ id: "welcome-4", text: "Drag the handle to reorder rows" },
		],
	},
	{
		id: "plan",
		text: "Plan your day",
		children: [
			{
				id: "plan-1",
				type: "task",
				text: "Ship the outliner demo",
				completed: true,
			},
			{ id: "plan-2", type: "task", text: "Reply to emails" },
			{ id: "plan-3", type: "task", text: "Go for a walk" },
		],
	},
	{
		id: "ideas",
		text: "Ideas",
		children: [
			{
				id: "ideas-1",
				text: "Nested outlines are just better",
				expanded: false,
				children: [
					{ id: "ideas-1-1", text: "Everything is a list of lists" },
					{ id: "ideas-1-2", text: "Collapse what you don't need right now" },
				],
			},
			{ id: "ideas-2", text: "One outline for everything" },
		],
	},
	{
		id: "note",
		text: "Nothing here is saved — it's just a demo. Sign up to keep your own.",
	},
];

export const demoInitialRows = collectVisible(demoSeedTree, null, 0);

export const demoSubtreeCache = (() => {
	const cache = new Map<string, VisibleNodeRow[]>();
	collectSubtreeCache(demoSeedTree, cache);
	return cache;
})();
