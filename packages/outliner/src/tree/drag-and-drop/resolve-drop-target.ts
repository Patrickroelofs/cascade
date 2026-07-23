import type { Instruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import type { VisibleNodeRow } from "../../nodes/model/node-types";
import type { MoveTarget } from "../rows/move-targets";
import { subtreeRange } from "../rows/row-structure";

export function resolveDropTarget(
	instruction: Instruction,
	targetRow: VisibleNodeRow,
	rows: VisibleNodeRow[],
): MoveTarget | null {
	if (instruction.type === "instruction-blocked") return null;

	if (instruction.type === "reorder-above") {
		return {
			position: "before",
			targetId: targetRow.id,
			parentId: targetRow.parentId,
		};
	}

	if (instruction.type === "reorder-below") {
		const targetIndex = rows.findIndex((row) => row.id === targetRow.id);
		const firstChild = rows[targetIndex + 1];
		if (
			targetRow.expanded &&
			targetRow.hasChildren &&
			firstChild?.parentId === targetRow.id
		) {
			return {
				position: "before",
				targetId: firstChild.id,
				parentId: targetRow.id,
			};
		}

		return {
			position: "after",
			targetId: targetRow.id,
			parentId: targetRow.parentId,
		};
	}

	if (instruction.type === "make-child") {
		return { position: "append", parentId: targetRow.id };
	}

	return null;
}

export function isInSubtree(
	rows: VisibleNodeRow[],
	sourceId: string,
	id: string,
): boolean {
	if (sourceId === id) return true;

	const range = subtreeRange(rows, sourceId);
	if (!range) return false;

	for (let index = range.start + 1; index < range.end; index++) {
		if (rows[index].id === id) return true;
	}
	return false;
}
