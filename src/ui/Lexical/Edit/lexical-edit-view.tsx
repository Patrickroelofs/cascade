import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import type { NodeType } from "#/core/nodes/node.types";
import type { LexicalElementNode } from "#/ui/Lexical/Read/lexical-read-view";
import type { LexicalTextNode } from "#/ui/Lexical/Read/render-text-nodes";

interface LexicalEditViewProps extends Pick<NodeType, "id"> {
	content: {
		root: LexicalElementNode;
	};
}

function buildInitialState(content: LexicalEditViewProps["content"]) {
	return () => {
		const root = $getRoot();
		for (const paragraph of content.root.children ?? []) {
			const paragraphNode = $createParagraphNode();
			const children =
				"children" in paragraph ? (paragraph.children ?? []) : [];
			for (const child of children as LexicalTextNode[]) {
				const textNode = $createTextNode(child.text);
				textNode.setFormat(child.format ?? 0);
				paragraphNode.append(textNode);
			}
			root.append(paragraphNode);
		}
	};
}

export function LexicalEditView({ id, content }: LexicalEditViewProps) {
	return (
		<LexicalComposer
			initialConfig={{
				namespace: `node-editor-${id}`,
				onError: (error) => {
					throw error;
				},
				editorState: buildInitialState(content),
			}}
		>
			<RichTextPlugin
				contentEditable={<ContentEditable />}
				placeholder={null}
				ErrorBoundary={({ children }) => children}
			/>
		</LexicalComposer>
	);
}
