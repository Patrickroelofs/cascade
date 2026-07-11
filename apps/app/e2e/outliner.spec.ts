import { expect, test } from "./support/fixtures";

test.describe("outliner nesting", () => {
	test("indenting a node under its previous sibling makes it a child", async ({
		outliner,
		orpcClient,
		// Referenced only to trigger the fixture: it navigates to a fresh,
		// isolated node before the test and deletes it afterward.
		scratchNode: _scratchNode,
	}) => {
		const groceriesId = await outliner.addRootNode();
		await outliner.typeText(groceriesId, "Groceries");

		await outliner.pressEnter(groceriesId);
		const milkId = await outliner.editingNodeId();
		await outliner.typeText(milkId, "Milk");
		await outliner.indent(milkId);
		await outliner.commit(milkId);

		const milk = await orpcClient.nodes.get({ id: milkId });
		expect(milk.parentId).toBe(groceriesId);

		await expect(outliner.toggle(groceriesId)).toHaveAttribute(
			"aria-expanded",
			"true",
		);
	});
});
