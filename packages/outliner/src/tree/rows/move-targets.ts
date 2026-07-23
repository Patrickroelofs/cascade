import type { VisibleNodeRow } from "../../nodes/model/node-types";
import { subtreeRange } from "./row-structure";

export type MoveTarget =
	| { position: "before" | "after"; targetId: string; parentId: string | null }
	| { position: "append"; parentId: string | null };

export function findIndentTarget(
	rows: VisibleNodeRow[],
	id: string,
): MoveTarget | null {
	const index = rows.findIndex((row) => row.id === id);
	if (index === -1) return null;

	const depth = rows[index].depth;
	for (let current = index - 1; current >= 0; current--) {
		if (rows[current].depth < depth) return null;
		if (rows[current].depth === depth) {
			return { position: "append", parentId: rows[current].id };
		}
	}

	return null;
}

export function findOutdentTarget(
	rows: VisibleNodeRow[],
	id: string,
): MoveTarget | null {
	const row = rows.find((candidate) => candidate.id === id);
	if (!row || row.parentId === null) return null;

	const parent = rows.find((candidate) => candidate.id === row.parentId);
	if (!parent) return null;

	return { position: "after", targetId: parent.id, parentId: parent.parentId };
}

export function findMoveUpTarget(
	rows: VisibleNodeRow[],
	id: string,
): MoveTarget | null {
	const index = rows.findIndex((row) => row.id === id);
	if (index === -1) return null;

	const row = rows[index];
	for (let current = index - 1; current >= 0; current--) {
		if (rows[current].depth < row.depth) return null;
		if (rows[current].depth !== row.depth) continue;

		return rows[current].parentId === row.parentId
			? {
					position: "before",
					targetId: rows[current].id,
					parentId: row.parentId,
				}
			: null;
	}

	return null;
}

export function findMoveDownTarget(
	rows: VisibleNodeRow[],
	id: string,
): MoveTarget | null {
	const range = subtreeRange(rows, id);
	if (!range) return null;

	const row = rows[range.start];
	const next = rows[range.end];
	if (!next || next.depth !== row.depth || next.parentId !== row.parentId) {
		return null;
	}

	return { position: "after", targetId: next.id, parentId: row.parentId };
}

/** Captures the move target that restores a row to its current sibling slot. */
export function captureCurrentPosition(
	rows: VisibleNodeRow[],
	id: string,
): MoveTarget | null {
	const range = subtreeRange(rows, id);
	if (!range) return null;

	const row = rows[range.start];
	for (let current = range.start - 1; current >= 0; current--) {
		if (rows[current].depth < row.depth) break;
		if (rows[current].depth !== row.depth) continue;
		if (rows[current].parentId === row.parentId) {
			return {
				position: "after",
				targetId: rows[current].id,
				parentId: row.parentId,
			};
		}
		break;
	}

	const next = rows[range.end];
	if (next && next.depth === row.depth && next.parentId === row.parentId) {
		return { position: "before", targetId: next.id, parentId: row.parentId };
	}

	return { position: "append", parentId: row.parentId };
}
