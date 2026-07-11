import { test as base } from "@playwright/test";
import { createOrpcClient, type OrpcClient } from "./orpc-client";
import { OutlinerPage } from "./pages/outliner-page";

interface Fixtures {
	orpcClient: OrpcClient;
	/**
	 * A fresh, empty top-level node created through the real API and already
	 * navigated to (`/node/{id}`), so every test gets an isolated corner of
	 * the tree to work in — no shared state with the dev seed data or other
	 * tests, and no database reset required. Deleted (cascading to any
	 * children) after the test, pass or fail.
	 */
	scratchNode: { id: string };
	outliner: OutlinerPage;
}

export const test = base.extend<Fixtures>({
	orpcClient: async ({ context }, use) => {
		await use(createOrpcClient(context));
	},

	scratchNode: async ({ page, orpcClient }, use) => {
		const node = await orpcClient.nodes.create({ parentId: null });
		await page.goto(`/node/${node.id}`);
		await use({ id: node.id });
		await orpcClient.nodes.delete({ id: node.id });
	},

	outliner: async ({ page }, use) => {
		await use(new OutlinerPage(page));
	},
});

export { expect } from "@playwright/test";
