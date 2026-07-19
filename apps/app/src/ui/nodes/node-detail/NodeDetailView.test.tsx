// @vitest-environment jsdom
import type { TagSummary } from "@cascade/outliner/node-tags";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NodeDetailHeader } from "./NodeDetailView";

vi.mock("#/ui/nodes/breadcrumbs", () => ({
	Breadcrumbs: () => null,
}));

const { toastSuccess } = vi.hoisted(() => ({
	toastSuccess: vi.fn(),
}));

vi.mock("@cascade/ui/context-menu", () => ({
	ContextMenu: ({ children }: { children: ReactNode }) => <>{children}</>,
	ContextMenuTrigger: ({ children }: { children: ReactNode }) => (
		<>{children}</>
	),
	ContextMenuContent: ({ children }: { children: ReactNode }) => (
		<>{children}</>
	),
	ContextMenuItem: ({
		children,
		onClick,
	}: {
		children: ReactNode;
		onClick?: () => void;
	}) => (
		<button type="button" onClick={onClick}>
			{children}
		</button>
	),
}));

vi.mock("@cascade/ui/toast", () => ({
	toast: {
		success: toastSuccess,
	},
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		params,
		search: _search,
		...props
	}: {
		children: ReactNode;
		params: { nodeSlug: string };
		search?: boolean;
	}) => (
		<a href={`/${params.nodeSlug}`} {...props}>
			{children}
		</a>
	),
}));

const emptyTags: TagSummary[] = [];
const noop = () => {};

afterEach(() => {
	cleanup();
});

beforeEach(() => {
	toastSuccess.mockReset();
	Object.defineProperty(navigator, "clipboard", {
		value: { writeText: vi.fn().mockResolvedValue(undefined) },
		configurable: true,
	});
});

describe("NodeDetailHeader backlinks", () => {
	it("renders linked mentions as navigable entries", () => {
		render(
			<NodeDetailHeader
				node={{
					id: "11111111-1111-4111-8111-111111111111",
					parentId: null,
					content: {
						root: {
							type: "root",
							children: [
								{
									type: "paragraph",
									children: [{ type: "text", text: "Target" }],
								},
							],
						},
					},
					type: "text",
					metadata: null,
					expanded: false,
					order: "a0",
					dueDate: null,
					tags: [],
					hasChildren: false,
				}}
				backlinks={[
					{
						id: "22222222-2222-4222-8222-222222222222",
						content: {
							root: {
								type: "root",
								children: [
									{
										type: "paragraph",
										children: [{ type: "text", text: "Source node" }],
									},
								],
							},
						},
					},
				]}
				dueDate={null}
				completed={false}
				existingTags={emptyTags}
				onToggleTask={noop}
				onDueDateChange={noop}
				onTagsChange={noop}
				onDeleteTag={noop}
			/>,
		);

		expect(screen.getByText("Linked mentions")).toBeTruthy();
		const link = screen.getByRole("link", { name: "Source node" });
		expect(link.getAttribute("href")).toBe("/source-node-22222222");
	});

	it("copies a backlink URL from the context menu action", async () => {
		render(
			<NodeDetailHeader
				node={{
					id: "11111111-1111-4111-8111-111111111111",
					parentId: null,
					content: {
						root: {
							type: "root",
							children: [
								{
									type: "paragraph",
									children: [{ type: "text", text: "Target" }],
								},
							],
						},
					},
					type: "text",
					metadata: null,
					expanded: false,
					order: "a0",
					dueDate: null,
					tags: [],
					hasChildren: false,
				}}
				backlinks={[
					{
						id: "22222222-2222-4222-8222-222222222222",
						content: {
							root: {
								type: "root",
								children: [
									{
										type: "paragraph",
										children: [{ type: "text", text: "Source node" }],
									},
								],
							},
						},
					},
				]}
				dueDate={null}
				completed={false}
				existingTags={emptyTags}
				onToggleTask={noop}
				onDueDateChange={noop}
				onTagsChange={noop}
				onDeleteTag={noop}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Copy backlink" }));

		await vi.waitFor(() => {
			expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
				"http://localhost:3000/source-node-22222222",
			);
		});
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
			"http://localhost:3000/source-node-22222222",
		);
		await vi.waitFor(() => {
			expect(toastSuccess).toHaveBeenCalledWith("Backlink copied");
		});
	});
});
