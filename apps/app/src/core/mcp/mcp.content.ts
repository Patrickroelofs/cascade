import { lexicalToPlainText } from "@cascade/outliner/lexical-content";
import type { VisibleNodeRow } from "@cascade/outliner/node-types";

// Node content is a single paragraph in practice, so this comfortably covers
// full reads (the default 200-char limit is for row previews in the app).
const TEXT_LIMIT = 10_000;

export function nodeText(content: unknown): string {
	return lexicalToPlainText(content, TEXT_LIMIT);
}

function taskCheckbox(metadata: unknown): string {
	const completed =
		metadata !== null &&
		typeof metadata === "object" &&
		"completed" in metadata &&
		metadata.completed === true;
	return completed ? "[x] " : "[ ] ";
}

/**
 * Renders visibleTree rows as an indented plain-text outline, one node per
 * line, with the node id appended so tools can reference specific nodes.
 */
export function renderOutline(rows: VisibleNodeRow[]): string {
	return rows
		.map((row) => {
			const indent = "\t".repeat(row.depth);
			const checkbox = row.type === "task" ? taskCheckbox(row.metadata) : "";
			const text = nodeText(row.content) || "(empty)";
			const collapsed =
				row.hasChildren && !row.expanded ? " (children hidden)" : "";
			return `${indent}- ${checkbox}${text} [id: ${row.id}]${collapsed}`;
		})
		.join("\n");
}
