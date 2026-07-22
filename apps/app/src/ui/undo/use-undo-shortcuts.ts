import { useEffect } from "react";
import { undoStore } from "./undo-store";

const TEXT_INPUT_TAGS = new Set(["INPUT", "TEXTAREA"]);

/**
 * Global Cmd/Ctrl+Z (undo) and Shift+Cmd/Ctrl+Z (redo). Skipped inside plain
 * `<input>`/`<textarea>` fields (e.g. the due-date/tag editors) so their
 * native undo keeps working; the Lexical node editor is a contentEditable
 * div, not one of those, and has no history plugin of its own, so this is
 * the only undo it gets.
 */
export function useUndoShortcuts() {
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (
				!(event.metaKey || event.ctrlKey) ||
				event.key.toLowerCase() !== "z"
			) {
				return;
			}
			const target = event.target as HTMLElement | null;
			if (target && TEXT_INPUT_TAGS.has(target.tagName)) return;

			event.preventDefault();
			if (event.shiftKey) {
				undoStore.redo();
			} else {
				undoStore.undo();
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);
}
