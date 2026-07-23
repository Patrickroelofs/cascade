import {
	$createRangeSelection,
	$getNearestNodeFromDOMNode,
	$getRoot,
	$isTextNode,
	$setSelection,
	type LexicalEditor,
} from "lexical";
import { type RefObject, useEffect } from "react";
import type { FocusPoint } from "../../model/focus-point";

export function useEditorFocus(
	editor: LexicalEditor,
	focusPoint: FocusPoint | null,
	lastSavedRef: RefObject<string | null>,
	saveRef: RefObject<() => void>,
) {
	useEffect(() => {
		lastSavedRef.current = JSON.stringify(editor.getEditorState().toJSON());

		const rootElement = editor.getRootElement();
		const range =
			rootElement && focusPoint
				? caretRangeFromPoint(focusPoint.x, focusPoint.y)
				: null;

		if (rootElement && range && rootElement.contains(range.startContainer)) {
			selectCaretRange(editor, range);
			rootElement.focus({ preventScroll: true });
		} else if (rootElement) {
			editor.update(() => {
				$getRoot().selectEnd();
			});
			rootElement.focus({ preventScroll: true });
		}

		return () => saveRef.current();
	}, [editor, focusPoint, lastSavedRef, saveRef]);
}

function selectCaretRange(editor: LexicalEditor, range: Range) {
	editor.update(() => {
		const node = $getNearestNodeFromDOMNode(range.startContainer);
		if (!$isTextNode(node)) {
			$getRoot().selectEnd();
			return;
		}

		const selection = $createRangeSelection();
		selection.anchor.set(node.getKey(), range.startOffset, "text");
		selection.focus.set(node.getKey(), range.startOffset, "text");
		$setSelection(selection);
	});
}

/** Cross-browser caret lookup; Firefox lacks `caretRangeFromPoint`. */
function caretRangeFromPoint(x: number, y: number): Range | null {
	if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);

	const position = document.caretPositionFromPoint?.(x, y);
	if (!position) return null;

	const range = document.createRange();
	range.setStart(position.offsetNode, position.offset);
	range.collapse(true);
	return range;
}
