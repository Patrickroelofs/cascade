import {
	lexicalToPlainText,
	textRunsToLexicalContent,
	textToLexicalContent,
} from "@cascade/outliner/lexical-content";
import type { VisibleNodeRow } from "@cascade/outliner/node-types";
import { describe, expect, it } from "vitest";
import { nodeText, renderOutline } from "@/core/mcp/mcp.content";

function row(overrides: Partial<VisibleNodeRow>): VisibleNodeRow {
	return {
		id: "id",
		parentId: null,
		content: textToLexicalContent("node"),
		type: "text",
		metadata: null,
		expanded: true,
		order: "a0",
		depth: 0,
		path: ["a0"],
		hasChildren: false,
		isLastChild: true,
		...overrides,
	};
}

describe("textToLexicalContent", () => {
	it("round-trips through lexicalToPlainText", () => {
		const content = textToLexicalContent("Buy milk and bread");
		expect(lexicalToPlainText(content)).toBe("Buy milk and bread");
	});

	it("produces an empty paragraph for empty text", () => {
		const content = textToLexicalContent("");
		expect(lexicalToPlainText(content)).toBe("");
	});

	it("keeps formatted runs readable as plain text", () => {
		const content = textRunsToLexicalContent([
			{ text: "plain " },
			{ text: "bold", format: 1 },
		]);
		expect(lexicalToPlainText(content)).toBe("plain bold");
	});
});

describe("nodeText", () => {
	it("reads beyond the default preview limit", () => {
		const long = "x".repeat(500);
		expect(nodeText(textToLexicalContent(long))).toBe(long);
	});

	it("returns an empty string for malformed content", () => {
		expect(nodeText(null)).toBe("");
		expect(nodeText({ nope: true })).toBe("");
	});
});

describe("renderOutline", () => {
	it("indents by depth and appends node ids", () => {
		const outline = renderOutline([
			row({ id: "a", content: textToLexicalContent("Parent"), depth: 0 }),
			row({
				id: "b",
				parentId: "a",
				content: textToLexicalContent("Child"),
				depth: 1,
			}),
		]);
		expect(outline).toBe("- Parent [id: a]\n\t- Child [id: b]");
	});

	it("renders task checkboxes from metadata", () => {
		const outline = renderOutline([
			row({
				id: "todo",
				content: textToLexicalContent("Open task"),
				type: "task",
				metadata: { completed: false },
			}),
			row({
				id: "done",
				content: textToLexicalContent("Done task"),
				type: "task",
				metadata: { completed: true },
			}),
		]);
		expect(outline).toBe(
			"- [ ] Open task [id: todo]\n- [x] Done task [id: done]",
		);
	});

	it("marks collapsed nodes with hidden children and empty content", () => {
		const outline = renderOutline([
			row({
				id: "c",
				content: textToLexicalContent(""),
				expanded: false,
				hasChildren: true,
			}),
		]);
		expect(outline).toBe("- (empty) [id: c] (children hidden)");
	});
});
