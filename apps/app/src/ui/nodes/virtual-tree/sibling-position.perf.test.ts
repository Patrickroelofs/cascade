import type { VisibleNodeRow } from "@cascade/outliner/node-types";
import { siblingPosition } from "@cascade/outliner/visible-rows";
import { describe, expect, it } from "vitest";

/**
 * Regression test for issue #296: siblingPosition used to findIndex over the
 * *entire* flat rows array to locate its own row on every call, even though
 * its only caller (VirtualTreeRow) already knows the row's index from the
 * virtualizer. Asserts the fixed complexity property directly — bounded
 * array reads independent of total row count — rather than wall-clock
 * timing, so this is fast and deterministic instead of flaky in CI.
 */

function row(
	id: string,
	parentId: string | null,
	depth: number,
): VisibleNodeRow {
	return {
		id,
		parentId,
		content: null,
		type: "task",
		metadata: { completed: false },
		expanded: true,
		order: id,
		dueDate: null,
		tags: [],
		depth,
		path: [id],
		hasChildren: false,
		isLastChild: false,
	};
}

// Many top-level sections with a few children each: a large flat array where
// each row's local sibling run is short, mirroring a realistic large tree
// (as opposed to one giant flat list of siblings).
function buildRows(
	sectionCount: number,
	childrenPerSection: number,
): VisibleNodeRow[] {
	const rows: VisibleNodeRow[] = [];
	for (let s = 0; s < sectionCount; s++) {
		const sectionId = `section-${s}`;
		rows.push(row(sectionId, null, 0));
		for (let c = 0; c < childrenPerSection; c++) {
			rows.push(row(`${sectionId}-child-${c}`, sectionId, 1));
		}
	}
	return rows;
}

/** Wraps an array to count reads of numeric indices, e.g. `rows[i]`. */
function countIndexReads(rows: VisibleNodeRow[]): {
	proxy: VisibleNodeRow[];
	reads: () => number;
} {
	let count = 0;
	const proxy = new Proxy(rows, {
		get(target, prop, receiver) {
			if (typeof prop === "string" && /^\d+$/.test(prop)) count++;
			return Reflect.get(target, prop, receiver);
		},
	});
	return { proxy, reads: () => count };
}

describe("siblingPosition", () => {
	it("touches only the local sibling run, not the whole rows array", () => {
		const rows = buildRows(4_000, 5); // 24,000 rows total
		const lastIndex = rows.length - 1;
		const { proxy, reads } = countIndexReads(rows);

		const result = siblingPosition(proxy, lastIndex);

		expect(result).toEqual({ posInSet: 5, setSize: 5 });
		// The local run for this row is 5 siblings; a correct implementation
		// reads a small, constant-ish number of indices regardless of total row
		// count. The pre-fix implementation did a findIndex first, reading all
		// 24,000 entries before ever reaching the local scan.
		expect(reads()).toBeLessThan(50);
	});

	it("stays bounded as the array grows", () => {
		const readsForLastRow = (rows: VisibleNodeRow[]) => {
			const { proxy, reads } = countIndexReads(rows);
			siblingPosition(proxy, rows.length - 1);
			return reads();
		};

		const small = readsForLastRow(buildRows(500, 5));
		const large = readsForLastRow(buildRows(20_000, 5));

		// 40x more rows shouldn't mean meaningfully more index reads: the read
		// count is a function of the local sibling run, not array length.
		expect(large).toBeLessThanOrEqual(small + 5);
	});
});
