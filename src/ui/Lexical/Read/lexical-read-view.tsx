import { renderNode } from "#/ui/Lexical/Read/lexical-render-node";
import type { LexicalTextNode } from "#/ui/Lexical/Read/render-text-nodes";

export interface LexicalElementNode {
	type: string;
	children?: (LexicalTextNode | LexicalElementNode)[];
}

interface LexicalReadViewProps {
	content: {
		root: LexicalElementNode;
	};
}

export function LexicalReadView({ content }: LexicalReadViewProps) {
	return (
		<>
			{content.root.children?.map((child, index) => renderNode(child, index))}
		</>
	);
}
