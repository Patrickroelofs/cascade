import type { ReactNode } from "react";

const BOLD = 1;
const ITALIC = 2;
const STRIKETHROUGH = 4;
const UNDERLINE = 8;

interface LexicalTextNode {
	type: "text";
	text: string;
	format?: number;
}

export interface LexicalElementNode {
	type: string;
	children?: (LexicalTextNode | LexicalElementNode)[];
}

function renderTextNode(node: LexicalTextNode, key: number): ReactNode {
	const fmt = node.format ?? 0;
	let el: ReactNode = node.text;
	if (fmt & UNDERLINE) el = <u key={key}>{el}</u>;
	if (fmt & STRIKETHROUGH) el = <s key={key}>{el}</s>;
	if (fmt & ITALIC) el = <em key={key}>{el}</em>;
	if (fmt & BOLD) el = <strong key={key}>{el}</strong>;
	return fmt ? el : <span key={key}>{node.text}</span>;
}

function renderNode(
	node: LexicalTextNode | LexicalElementNode,
	key: number,
): ReactNode {
	if (node.type === "text") return renderTextNode(node as LexicalTextNode, key);
	const children =
		(node as LexicalElementNode).children?.map((child, index) =>
			renderNode(child, index),
		) ?? null;
	if (node.type === "paragraph")
		return (
			<p key={key} className="m-0">
				{children}
			</p>
		);
	return <span key={key}>{children}</span>;
}

interface Props {
	content: {
		root: LexicalElementNode;
	};
}

export function LexicalReadView({ content }: Props) {
	return (
		<>
			{content.root.children?.map((child, index) => renderNode(child, index))}
		</>
	);
}
