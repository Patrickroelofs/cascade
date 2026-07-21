import { useRef } from "react";
import { useOutlinerLabels } from "./labels-context";
import { LexicalEditView } from "./lexical/edit/lexical-edit-view";
import { toLexicalContent } from "./lexical/lexical-content";
import {
	removeLinkFromContent,
	updateLinkInContent,
} from "./lexical/link-content";
import type { LexicalElementNode } from "./lexical/read/lexical-read-view";
import { LexicalReadView } from "./lexical/read/lexical-read-view";

export interface FocusPoint {
	x: number;
	y: number;
}

interface NodeEditorProps {
	id: string;
	content: unknown;
	editing: boolean;
	completed?: boolean;
	focusPoint: FocusPoint | null;
	onStartEdit: (point?: FocusPoint) => void;
	onExit: () => void;
	onSave: (content: { root: LexicalElementNode }) => void;
	onCreateBelow?: () => void;
	onDeleteEmpty?: () => void;
	onIndent?: () => void;
	onOutdent?: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	onFocusNext?: () => void;
	onFocusPrevious?: () => void;
}

export function NodeEditor({
	id,
	content,
	editing,
	completed,
	focusPoint,
	onStartEdit,
	onExit,
	onSave,
	onCreateBelow,
	onDeleteEmpty,
	onIndent,
	onOutdent,
	onMoveUp,
	onMoveDown,
	onFocusNext,
	onFocusPrevious,
}: NodeEditorProps) {
	const labels = useOutlinerLabels();
	const mouseDownPointRef = useRef<{ x: number; y: number } | null>(null);
	if (editing) {
		return (
			<LexicalEditView
				id={id}
				content={toLexicalContent(content)}
				focusPoint={focusPoint}
				onSave={onSave}
				onExit={onExit}
				onCreateBelow={onCreateBelow}
				onDeleteEmpty={onDeleteEmpty}
				onIndent={onIndent}
				onOutdent={onOutdent}
				onFocusNext={onFocusNext}
				onFocusPrevious={onFocusPrevious}
			/>
		);
	}

	return (
		// biome-ignore lint/a11y/useSemanticElements: the read view renders block elements (<p>), which are invalid inside <button>; keyboard/focus semantics are provided explicitly
		<div
			role="button"
			tabIndex={0}
			aria-label={labels.editNodeText}
			data-node-focus-target
			className={`cursor-text text-left flex-1 min-w-0 rr-block ${completed ? "line-through text-muted dark:text-canvas/30" : ""}`}
			onMouseDown={(event) => {
				mouseDownPointRef.current = { x: event.clientX, y: event.clientY };
			}}
			onClick={(event) => {
				// A click-drag to select (or copy) this row's text ends with a
				// "click" event too. Entering edit mode right then would swap this
				// read view out for the editable one, tearing down the very DOM
				// nodes the browser's selection anchors to and silently clearing
				// it — so a click whose mousedown was measurably far from where it
				// ended (an actual drag, not just a click) skips edit mode as long
				// as it left behind a real selection. A plain click always skips
				// this check and enters edit mode regardless of any selection made
				// by an earlier, unrelated drag — the selection API doesn't
				// reliably report an old selection as collapsed by the time a
				// later plain click's own "click" event fires.
				const start = mouseDownPointRef.current;
				const dragged =
					start !== null &&
					(Math.abs(event.clientX - start.x) > 5 ||
						Math.abs(event.clientY - start.y) > 5);
				if (dragged) {
					const selection = window.getSelection();
					if (selection && !selection.isCollapsed && selection.toString()) {
						return;
					}
				}
				onStartEdit({ x: event.clientX, y: event.clientY });
			}}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onStartEdit();
					return;
				}
				// Keyboard equivalent of dragging a row past its sibling — the
				// pointer-only reorder path in row-drag-drop.tsx.
				if (event.altKey && event.shiftKey) {
					if (event.key === "ArrowDown") {
						event.preventDefault();
						onMoveDown?.();
					} else if (event.key === "ArrowUp") {
						event.preventDefault();
						onMoveUp?.();
					}
					return;
				}
				if (!event.shiftKey) return;
				if (event.key === "ArrowDown") {
					event.preventDefault();
					onFocusNext?.();
				} else if (event.key === "ArrowUp") {
					event.preventDefault();
					onFocusPrevious?.();
				}
			}}
		>
			<LexicalReadView
				content={toLexicalContent(content)}
				onSaveLink={(path, update) => {
					const current = toLexicalContent(content);
					if (!current) return;
					const updated = updateLinkInContent(current, path, update);
					if (updated) onSave(updated);
				}}
				onDeleteLink={(path, update) => {
					const current = toLexicalContent(content);
					if (!current) return;
					const updated = removeLinkFromContent(current, path, update.text);
					if (updated) onSave(updated);
				}}
			/>
		</div>
	);
}
