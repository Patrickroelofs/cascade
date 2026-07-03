import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { EditableContent } from "@/ui/lexical/edit/lexical-editable-content";
import type { LexicalElementNode } from "@/ui/lexical/read/lexical-read-view";
import type { FocusPoint } from "@/ui/nodes/node-editor";

export interface LexicalEditViewProps {
	id: string;
	content: { root: LexicalElementNode } | null;
	focusPoint: FocusPoint | null;
	onSave: (content: { root: LexicalElementNode }) => void;
	onExit?: () => void;
}

export function LexicalEditView({
	id,
	content,
	focusPoint,
	onSave,
	onExit,
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
			/>
		</LexicalComposer>
	);
}
