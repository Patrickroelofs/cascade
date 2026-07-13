import { expect, type Locator, type Page } from "@playwright/test";

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
		await this.waitForRowEntranceAnimation(id);
		return id;
	}

	/** Enters edit mode for a node that isn't currently being edited. */
	async startEditing(nodeId: string): Promise<void> {
		await this.row(nodeId).locator("[data-node-focus-target]").click();
	}

	/**
	 * The target is always already focused by this point (creation and
	 * `startEditing` both auto-focus), so this deliberately skips `.click()`:
	 * `.press()`/`.pressSequentially()` dispatch key events to whatever's
	 * focused rather than requiring the element to sit still at a hit-test
	 * point, which a still-animating row (see `waitForRowEntranceAnimation`)
	 * is not.
	 */
	async typeText(nodeId: string, text: string): Promise<void> {
		await this.editableContent(nodeId).pressSequentially(text);
	}

	/** Saves the current content and creates a new sibling below, focused for editing. */
	async pressEnter(nodeId: string): Promise<void> {
		await this.editableContent(nodeId).press("Enter");
		const id = await this.editingNodeId();
		await this.waitForRowEntranceAnimation(id);
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
	 * `dragAnimationConfig.enter`: opacity 0→1 over ~250ms + 50ms stagger,
	 * `flip-displacement.ts`). Interacting with a row while it's still
	 * translating makes Playwright's actionability checks unreliable, so
	 * wait for the tween to actually finish — polling the real condition
	 * rather than sleeping a fixed duration, since how long that takes
	 * varies with how much tracing/recording overhead the run has (e.g.
	 * `--ui` mode is markedly slower per action than a headless run).
	 */
	private async waitForRowEntranceAnimation(nodeId: string): Promise<void> {
		await expect(this.row(nodeId)).toHaveCSS("opacity", "1");
	}
}
