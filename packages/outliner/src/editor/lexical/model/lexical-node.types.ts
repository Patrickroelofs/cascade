import type { HeadingTag } from "./heading-styles";

export interface LexicalTextNode {
	type: "text";
	text: string;
	format?: number;
}

export interface LexicalElementNode {
	type: string;
	tag?: HeadingTag;
	children?: (LexicalTextNode | LexicalElementNode)[];
}
