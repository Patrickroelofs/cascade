import type { EditorState, LexicalEditor } from "lexical";
import { useRef } from "react";
import type { LexicalElementNode } from "../model/lexical-node.types";

type SaveHandler = (content: { root: LexicalElementNode }) => void;

export function useEditorSave(editor: LexicalEditor, onSave: SaveHandler) {
	const lastSavedRef = useRef<string | null>(null);

	const save = () => {
		const state = editor.getEditorState().toJSON();
		const serialized = serializeEditorState(state);
		if (serialized === lastSavedRef.current) return;

		lastSavedRef.current = serialized;
		onSave({ root: state.root as unknown as LexicalElementNode });
	};

	const saveRef = useRef(save);
	saveRef.current = save;

	return { lastSavedRef, save, saveRef };
}

export function serializeEditorState(
	state: EditorState | ReturnType<EditorState["toJSON"]>,
) {
	return JSON.stringify(
		"toJSON" in state && typeof state.toJSON === "function"
			? state.toJSON()
			: state,
	);
}
