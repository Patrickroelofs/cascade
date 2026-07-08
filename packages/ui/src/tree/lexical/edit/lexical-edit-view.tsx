import { LexicalComposer } from "@lexical/react/LexicalComposer";
import type { FocusPoint } from "../../node-editor";
import type { LexicalElementNode } from "../read/lexical-read-view";
import { EditableContent } from "./lexical-editable-content";

export interface LexicalEditViewProps {
	id: string;
	content: { root: LexicalElementNode } | null;
	focusPoint: FocusPoint | null;
	onSave: (content: { root: LexicalElementNode }) => void;
	onExit?: () => void;
	onCreateBelow?: () => void;
	onDeleteEmpty?: () => void;
	onIndent?: () => void;
	onOutdent?: () => void;
}

export function LexicalEditView({
	id,
	content,
	focusPoint,
	onSave,
	onExit,
	onCreateBelow,
	onDeleteEmpty,
	onIndent,
	onOutdent,
}: LexicalEditViewProps) {
	return (
		<LexicalComposer
			initialConfig={{
				namespace: `node-editor-${id}`,
				onError: (error) => console.error("lexical error", error),
				editorState: content ? JSON.stringify(content) : null,
			}}
		>
			<EditableContent
				focusPoint={focusPoint}
				onSave={onSave}
				onExit={onExit}
				onCreateBelow={onCreateBelow}
				onDeleteEmpty={onDeleteEmpty}
				onIndent={onIndent}
				onOutdent={onOutdent}
			/>
		</LexicalComposer>
	);
}
