import type { VisibleNodeRow } from "../../nodes/model/node-types";

/** Finds a node and its contiguous visible descendants. */
export function subtreeRange(
	rows: VisibleNodeRow[],
	id: string,
): { start: number; end: number } | null {
	const start = rows.findIndex((row) => row.id === id);
	if (start === -1) return null;

	const depth = rows[start].depth;
	let end = start + 1;
	while (end < rows.length && rows[end].depth > depth) end++;
	return { start, end };
}

/** Recomputes sibling-tail flags in one backwards pass. */
export function recomputeIsLastChild(rows: VisibleNodeRow[]): VisibleNodeRow[] {
	const seenParents = new Set<string | null>();
	const result = new Array<VisibleNodeRow>(rows.length);

	for (let index = rows.length - 1; index >= 0; index--) {
		const row = rows[index];
		const isLastChild = !seenParents.has(row.parentId);
		seenParents.add(row.parentId);
		result[index] =
			row.isLastChild === isLastChild ? row : { ...row, isLastChild };
	}

	return result;
}

/**
 * Returns the row's 1-indexed position and sibling count for tree ARIA
 * metadata. The scans remain within the surrounding sibling run.
 */
export function siblingPosition(
	rows: VisibleNodeRow[],
	index: number,
): { posInSet: number; setSize: number } | null {
	const row = rows[index];
	if (!row) return null;

	let posInSet = 1;
	for (let current = index - 1; current >= 0; current--) {
		if (rows[current].depth < row.depth) break;
		if (
			rows[current].depth === row.depth &&
			rows[current].parentId === row.parentId
		) {
			posInSet++;
		}
	}

	let setSize = posInSet;
	for (let current = index + 1; current < rows.length; current++) {
		if (rows[current].depth < row.depth) break;
		if (
			rows[current].depth === row.depth &&
			rows[current].parentId === row.parentId
		) {
			setSize++;
		}
	}

	return { posInSet, setSize };
}
