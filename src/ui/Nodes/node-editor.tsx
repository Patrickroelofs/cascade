import type { NodeType } from "#/core/nodes/node.types";
import {
	type LexicalElementNode,
	LexicalReadView,
} from "#/ui/Lexical/Read/lexical-read-view";

interface NodeEditorProps {
	node: NodeType;
}

export function NodeEditor({ node }: NodeEditorProps) {
	return (
		<div className="flex-1 min-w-0 cursor-text">
			<LexicalReadView content={node.content as { root: LexicalElementNode }} />
		</div>
	);
}
