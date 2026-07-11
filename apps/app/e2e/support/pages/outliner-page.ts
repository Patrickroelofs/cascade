import type { Locator, Page } from "@playwright/test";

/**
 * Page Object over `VirtualTree` (packages/outliner). Wraps the existing
 * automation hooks the outliner already ships with for drag-and-drop and
 * focus management — `data-node-id` on each row and `data-node-focus-target`
 * on its read-view — rather than adding new ones. Keeps every selector in
 * one place so spec files read as user actions, not DOM queries.
 */
export class OutlinerPage {
	constructor(private readonly page: Page) {}

	row(nodeId: string): Locator {
		return this.page.locator(`[data-node-id="${nodeId}"]`);
	}

	toggle(nodeId: string): Locator {
		return this.row(nodeId).getByRole("button", { name: /Expand|Collapse/ });
	}

	private editableContent(nodeId: string): Locator {
		return this.row(nodeId).locator('[contenteditable="true"]');
	}

	/** The row whose text is currently being edited, regardless of its id. */
	private editingRow(): Locator {
		return this.page
			.locator("[data-node-id]")
			.filter({ has: this.page.locator('[contenteditable="true"]') });
	}

	/** Id of whichever row is currently in edit mode. */
	async editingNodeId(): Promise<string> {
		const id = await this.editingRow().getAttribute("data-node-id");
		if (!id) throw new Error("No row is currently in edit mode");
		return id;
	}

	/** Clicks the tree's "Add node" button and returns the id of the new (already editing) node. */
	async addRootNode(): Promise<string> {
		await this.page.getByRole("button", { name: "Add node" }).click();
		const id = await this.editingNodeId();
		await this.waitForRowEntranceAnimation();
		return id;
	}

	/** Enters edit mode for a node that isn't currently being edited. */
	async startEditing(nodeId: string): Promise<void> {
		await this.row(nodeId).locator("[data-node-focus-target]").click();
	}

	async typeText(nodeId: string, text: string): Promise<void> {
		const content = this.editableContent(nodeId);
		await content.click();
		await content.pressSequentially(text);
	}

	/** Saves the current content and creates a new sibling below, focused for editing. */
	async pressEnter(nodeId: string): Promise<void> {
		await this.editableContent(nodeId).press("Enter");
		await this.waitForRowEntranceAnimation();
	}

	async indent(nodeId: string): Promise<void> {
		await this.editableContent(nodeId).press("Tab");
	}

	async outdent(nodeId: string): Promise<void> {
		await this.editableContent(nodeId).press("Shift+Tab");
	}

	/** Blurs out of edit mode, saving content (the outliner has no explicit "save" action). */
	async commit(nodeId: string): Promise<void> {
		await this.editableContent(nodeId).blur();
	}

	/**
	 * New/inserted rows animate in via GSAP (packages/outliner's
	 * `dragAnimationConfig.enter`: ~250ms tween + 50ms stagger). Interacting
	 * with a row while it's still translating makes Playwright's
	 * actionability checks unreliable, so give it a beat to settle.
	 */
	private async waitForRowEntranceAnimation(): Promise<void> {
		await this.page.waitForTimeout(400);
	}
}
