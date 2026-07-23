import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
	draggable,
	dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import {
	attachInstruction,
	extractInstruction,
	type Instruction,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { VisibleNodeRow } from "../../nodes/model/node-types";
import type { MoveTarget } from "../rows/move-targets";
import { isInSubtree, resolveDropTarget } from "./resolve-drop-target";

interface UseRowDragAndDropOptions {
	row: VisibleNodeRow;
	rows: VisibleNodeRow[];
	indentSize: number;
	onMoveDrop: (draggedId: string, target: MoveTarget) => void;
}

type DragData = Record<string, unknown> & {
	nodeId: string;
};

export function useRowDragAndDrop(options: UseRowDragAndDropOptions) {
	const rowRef = useRef<HTMLDivElement>(null);
	const handleRef = useRef<HTMLButtonElement>(null);
	const [instruction, setInstruction] = useState<Instruction | null>(null);
	const latest = useRef(options);

	useLayoutEffect(() => {
		latest.current = options;
	});

	useEffect(() => {
		const rowElement = rowRef.current;
		const handle = handleRef.current;
		if (!rowElement || !handle) return;

		const id = latest.current.row.id;
		return combine(
			draggable({
				element: handle,
				getInitialData: (): DragData => ({ nodeId: id }),
				onGenerateDragPreview: ({ nativeSetDragImage }) => {
					setCustomNativeDragPreview({
						nativeSetDragImage,
						render: ({ container }) => {
							const preview = rowElement.cloneNode(true) as HTMLElement;
							preview.style.width = `${rowElement.offsetWidth}px`;
							container.append(preview);
							return () => preview.remove();
						},
					});
				},
			}),
			dropTargetForElements({
				element: rowElement,
				canDrop: ({ source }) => {
					const draggedId = (source.data as DragData).nodeId;
					return !isInSubtree(latest.current.rows, draggedId, id);
				},
				getData: ({ input, element }) => {
					const { row, indentSize } = latest.current;
					return attachInstruction(
						{ nodeId: id },
						{
							input,
							element,
							currentLevel: row.depth,
							indentPerLevel: indentSize,
							mode: getInstructionMode(row),
							block: ["reparent"],
						},
					);
				},
				onDrag: ({ self }) => setInstruction(extractInstruction(self.data)),
				onDragLeave: () => setInstruction(null),
				onDrop: ({ self, source }) => {
					setInstruction(null);

					const draggedId = (source.data as DragData).nodeId;
					const dropInstruction = extractInstruction(self.data);
					const { row, rows, onMoveDrop } = latest.current;
					if (!dropInstruction || draggedId === id) return;

					const target = resolveDropTarget(dropInstruction, row, rows);
					if (target) onMoveDrop(draggedId, target);
				},
			}),
		);
	}, []);

	return { rowRef, handleRef, instruction };
}

function getInstructionMode(row: VisibleNodeRow) {
	if (row.expanded && row.hasChildren) return "expanded";
	return row.isLastChild ? "last-in-group" : "standard";
}
