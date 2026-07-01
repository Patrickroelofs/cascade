import type { ReactNode } from "react";
import type { LexicalElementNode } from "#/ui/Lexical/Read/lexical-read-view";
import {
	type LexicalTextNode,
	renderTextNode,
} from "#/ui/Lexical/Read/render-text-nodes";

export function renderNode(
	node: LexicalTextNode | LexicalElementNode,
	key: number,
): ReactNode {
	switch (node.type) {
		case "text":
			return renderTextNode(node as LexicalTextNode, key);

		case "paragraph": {
			const children =
				node.children?.map((child, index) => renderNode(child, index)) ?? null;

			return <p key={key}>{children}</p>;
		}

		default: {
			throw new Error(`Unknown type ${node.type}`);
		}
	}
}
