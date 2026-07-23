import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import type { FocusPoint } from "../../model/focus-point";
import type { LexicalElementNode } from "../model/lexical-node.types";
import { useEditorCommands } from "./use-editor-commands";
import { useEditorFocus } from "./use-editor-focus";
import { useEditorSave } from "./use-editor-save";

interface EditableContentProps {
	focusPoint: FocusPoint | null;
	onSave: (content: { root: LexicalElementNode }) => void;
	onExit?: () => void;
	onCreateBelow?: () => void;
	onDeleteEmpty?: () => void;
	onIndent?: () => void;
	onOutdent?: () => void;
	onFocusNext?: () => void;
	onFocusPrevious?: () => void;
}

export function EditableContent({
	focusPoint,
	onSave,
	onExit,
	onCreateBelow,
	onDeleteEmpty,
	onIndent,
	onOutdent,
	onFocusNext,
	onFocusPrevious,
}: EditableContentProps) {
	const [editor] = useLexicalComposerContext();
	const { lastSavedRef, save, saveRef } = useEditorSave(editor, onSave);

	useEditorCommands(
		editor,
		{
			onCreateBelow,
			onDeleteEmpty,
			onIndent,
			onOutdent,
			onFocusNext,
			onFocusPrevious,
		},
		saveRef,
	);
	useEditorFocus(editor, focusPoint, lastSavedRef, saveRef);

	return (
		<RichTextPlugin
			contentEditable={
				<ContentEditable
					className="flex-1 outline-none w-full rr-block"
					onBlur={() => {
						save();
						onExit?.();
					}}
				/>
			}
			ErrorBoundary={LexicalErrorBoundary}
		/>
	);
}
