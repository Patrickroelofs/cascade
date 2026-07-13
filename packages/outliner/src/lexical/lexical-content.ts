import type { LexicalElementNode } from "./read/lexical-read-view";
import type { LexicalTextNode } from "./read/render-text-nodes";

/**
 * Single place where untyped jsonb content is narrowed to Lexical shape,
 * replacing the ad-hoc `as { root: ... }` casts at every boundary.
 */
export function toLexicalContent(
	content: unknown,
): { root: LexicalElementNode } | null {
	if (
		content !== null &&
		typeof content === "object" &&
		"root" in content &&
		content.root !== null &&
		typeof content.root === "object"
	) {
		return content as { root: LexicalElementNode };
	}
	return null;
}

export interface LexicalTextRun {
	text: string;
	// Lexical format bitmask: 1=bold, 2=italic, 4=strikethrough, 8=underline
	format?: number;
}

/**
 * Builds a minimal Lexical document (root > paragraph > text runs), the
 * write-side counterpart of `lexicalToPlainText`.
 */
export function textRunsToLexicalContent(runs: LexicalTextRun[]): {
	root: LexicalElementNode;
} {
	const root = {
		children: [
			{
				children: runs.map((run) => ({
					detail: 0,
					format: run.format ?? 0,
					mode: "normal",
					style: "",
					text: run.text,
					type: "text" as const,
					version: 1,
				})),
				direction: "ltr",
				format: "",
				indent: 0,
				type: "paragraph",
				version: 1,
			},
		],
		direction: "ltr",
		format: "",
		indent: 0,
		type: "root",
		version: 1,
	};
	return { root };
}

/** Builds a Lexical document holding a single unformatted text run. */
export function textToLexicalContent(text: string): {
	root: LexicalElementNode;
} {
	return textRunsToLexicalContent(text.length > 0 ? [{ text }] : []);
}

export function lexicalToPlainText(content: unknown, limit = 200): string {
	const lexical = toLexicalContent(content);
	if (!lexical) return "";
	let out = "";
	const walk = (node: LexicalElementNode | LexicalTextNode): void => {
		if (out.length >= limit) return;
		if (node.type === "text") {
			out += `${(node as LexicalTextNode).text} `;
			return;
		}
		for (const child of (node as LexicalElementNode).children ?? []) {
			if (out.length >= limit) return;
			walk(child);
		}
	};
	walk(lexical.root);
	return out.slice(0, limit).replace(/\s+/g, " ").trim();
}
