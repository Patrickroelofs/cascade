import { describe, expect, it } from "vitest";
import type { VisibleNodeRow } from "../node-types";
import {
	appendRow,
	collapseNode,
	expandNode,
	findIndentTarget,
	findOutdentTarget,
	insertRowAfter,
	moveSubtree,
	patchRow,
	removeSubtree,
	subtreeRange,
} from "./visible-rows";

function row(
	id: string,
	parentId: string | null,
	depth: number,
	overrides: Partial<VisibleNodeRow> = {},
): VisibleNodeRow {
	return {
		id,
		parentId,
		content: null,
		type: "text",
		metadata: null,
		expanded: false,
		order: id,
		depth,
		path: [id],
		hasChildren: false,
		isLastChild: false,
		...overrides,
	};
}

/**
 * a (expanded)
 *   a1
 *   a2 (expanded)
 *     a2x (last)
 * b (last root)
 */
function tree(): VisibleNodeRow[] {
	return [
		row("a", null, 0, { expanded: true, hasChildren: true }),
		row("a1", "a", 1),
		row("a2", "a", 1, { expanded: true, hasChildren: true, isLastChild: true }),
		row("a2x", "a2", 2, { isLastChild: true }),
		row("b", null, 0, { isLastChild: true }),
	];
}

const ids = (rows: VisibleNodeRow[]) => rows.map((r) => r.id);
const byId = (rows: VisibleNodeRow[], id: string) => {
	const found = rows.find((r) => r.id === id);
	if (!found) throw new Error(`row ${id} not found`);
	return found;
};

describe("subtreeRange", () => {
	it("spans a node and all deeper rows that follow it", () => {
		expect(subtreeRange(tree(), "a")).toEqual({ start: 0, end: 4 });
		expect(subtreeRange(tree(), "a2")).toEqual({ start: 2, end: 4 });
	});

	it("spans just the node itself for a leaf", () => {
		expect(subtreeRange(tree(), "a1")).toEqual({ start: 1, end: 2 });
		expect(subtreeRange(tree(), "b")).toEqual({ start: 4, end: 5 });
	});

	it("returns null for an unknown id", () => {
		expect(subtreeRange(tree(), "nope")).toBeNull();
	});
});

describe("patchRow", () => {
	it("patches only the matching row", () => {
		const out = patchRow(tree(), "a1", { expanded: true });
		expect(byId(out, "a1").expanded).toBe(true);
		expect(byId(out, "a").expanded).toBe(true);
		expect(byId(out, "b").expanded).toBe(false);
	});
});

describe("collapseNode", () => {
	it("drops visible descendants and marks the node collapsed", () => {
		const out = collapseNode(tree(), "a");
		expect(ids(out)).toEqual(["a", "b"]);
		expect(byId(out, "a").expanded).toBe(false);
		expect(byId(out, "a").hasChildren).toBe(true);
	});

	it("is a no-op for an unknown id", () => {
		expect(collapseNode(tree(), "nope")).toEqual(tree());
	});
});

describe("expandNode", () => {
	it("splices in subtree rows re-depthed relative to the node", () => {
		const collapsed = collapseNode(tree(), "a");
		const subtree = [
			row("a1", "a", 0),
			row("a2", "a", 0, { expanded: true, hasChildren: true }),
			row("a2x", "a2", 1),
		];
		const out = expandNode(collapsed, "a", subtree);
		expect(ids(out)).toEqual(["a", "a1", "a2", "a2x", "b"]);
		expect(byId(out, "a").expanded).toBe(true);
		expect(byId(out, "a1").depth).toBe(1);
		expect(byId(out, "a2x").depth).toBe(2);
	});

	it("marks hasChildren when the fetched subtree is non-empty", () => {
		const out = expandNode([row("x", null, 0)], "x", [row("x1", "x", 0)]);
		expect(byId(out, "x").hasChildren).toBe(true);
	});

	it("replaces any stale descendants instead of duplicating them", () => {
		const out = expandNode(tree(), "a2", [row("a2y", "a2", 0)]);
		expect(ids(out)).toEqual(["a", "a1", "a2", "a2y", "b"]);
	});
});

describe("removeSubtree", () => {
	it("removes the node and its visible descendants", () => {
		const out = removeSubtree(tree(), "a2");
		expect(ids(out)).toEqual(["a", "a1", "b"]);
	});

	it("clears the old parent's flags when its last visible child goes", () => {
		const out = removeSubtree(removeSubtree(tree(), "a1"), "a2");
		const a = byId(out, "a");
		expect(a.hasChildren).toBe(false);
		expect(a.expanded).toBe(false);
	});

	it("promotes the previous sibling to last child", () => {
		const out = removeSubtree(tree(), "a2");
		expect(byId(out, "a1").isLastChild).toBe(true);
	});

	it("is a no-op for an unknown id", () => {
		expect(removeSubtree(tree(), "nope")).toEqual(tree());
	});
});

describe("appendRow", () => {
	it("appends and reassigns the last-root flag", () => {
		const out = appendRow(tree(), row("c", null, 0));
		expect(ids(out)).toEqual(["a", "a1", "a2", "a2x", "b", "c"]);
		expect(byId(out, "b").isLastChild).toBe(false);
		expect(byId(out, "c").isLastChild).toBe(true);
	});
});

describe("insertRowAfter", () => {
	it("inserts after the anchor's whole subtree", () => {
		const out = insertRowAfter(tree(), "a2", row("a3", "a", 1));
		expect(ids(out)).toEqual(["a", "a1", "a2", "a2x", "a3", "b"]);
		expect(byId(out, "a2").isLastChild).toBe(false);
		expect(byId(out, "a3").isLastChild).toBe(true);
	});

	it("falls back to append when the anchor is missing", () => {
		const out = insertRowAfter(tree(), "nope", row("c", null, 0));
		expect(ids(out)).toEqual(["a", "a1", "a2", "a2x", "b", "c"]);
	});
});

describe("moveSubtree", () => {
	it("moves a subtree before a sibling, keeping descendants attached", () => {
		const out = moveSubtree(tree(), "a2", {
			position: "before",
			targetId: "a1",
			parentId: "a",
		});
		expect(ids(out)).toEqual(["a", "a2", "a2x", "a1", "b"]);
		expect(byId(out, "a2").depth).toBe(1);
		expect(byId(out, "a2x").depth).toBe(2);
		expect(byId(out, "a1").isLastChild).toBe(true);
	});

	it("moves after a target's whole subtree", () => {
		const out = moveSubtree(tree(), "a1", {
			position: "after",
			targetId: "a2",
			parentId: "a",
		});
		expect(ids(out)).toEqual(["a", "a2", "a2x", "a1", "b"]);
	});

	it("re-depths when appending into an expanded parent", () => {
		const out = moveSubtree(tree(), "b", {
			position: "append",
			parentId: "a2",
		});
		expect(ids(out)).toEqual(["a", "a1", "a2", "a2x", "b"]);
		expect(byId(out, "b").depth).toBe(2);
		expect(byId(out, "b").parentId).toBe("a2");
		expect(byId(out, "b").isLastChild).toBe(true);
	});

	it("hides the subtree when appending into a collapsed parent", () => {
		const rows = [
			row("a", null, 0, { isLastChild: false }),
			row("b", null, 0, { isLastChild: true }),
		];
		const out = moveSubtree(rows, "b", { position: "append", parentId: "a" });
		expect(ids(out)).toEqual(["a"]);
		expect(byId(out, "a").hasChildren).toBe(true);
	});

	it("appends to the root level", () => {
		const out = moveSubtree(tree(), "a1", {
			position: "append",
			parentId: null,
		});
		expect(ids(out)).toEqual(["a", "a2", "a2x", "b", "a1"]);
		expect(byId(out, "a1").depth).toBe(0);
		expect(byId(out, "a1").parentId).toBeNull();
		expect(byId(out, "a1").isLastChild).toBe(true);
	});

	it("repairs the old parent's flags when its only child moves out", () => {
		const out = moveSubtree(tree(), "a2x", {
			position: "append",
			parentId: null,
		});
		const a2 = byId(out, "a2");
		expect(a2.hasChildren).toBe(false);
		expect(a2.expanded).toBe(false);
	});

	it("is a no-op when the source or target is missing", () => {
		expect(
			moveSubtree(tree(), "nope", { position: "append", parentId: null }),
		).toEqual(tree());
		expect(
			moveSubtree(tree(), "a1", {
				position: "before",
				targetId: "nope",
				parentId: null,
			}),
		).toEqual(tree());
	});
});

describe("findIndentTarget", () => {
	it("targets the previous sibling as new parent", () => {
		expect(findIndentTarget(tree(), "a2")).toEqual({
			position: "append",
			parentId: "a1",
		});
	});

	it("skips over the previous sibling's descendants", () => {
		expect(findIndentTarget(tree(), "b")).toEqual({
			position: "append",
			parentId: "a",
		});
	});

	it("returns null for a first child or unknown id", () => {
		expect(findIndentTarget(tree(), "a1")).toBeNull();
		expect(findIndentTarget(tree(), "a")).toBeNull();
		expect(findIndentTarget(tree(), "nope")).toBeNull();
	});
});

describe("findOutdentTarget", () => {
	it("targets the position right after the current parent", () => {
		expect(findOutdentTarget(tree(), "a2x")).toEqual({
			position: "after",
			targetId: "a2",
			parentId: "a",
		});
	});

	it("returns null for roots and unknown ids", () => {
		expect(findOutdentTarget(tree(), "a")).toBeNull();
		expect(findOutdentTarget(tree(), "nope")).toBeNull();
	});
});
