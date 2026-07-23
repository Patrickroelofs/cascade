import { expect, test } from "./support/fixtures";

const content = (text: string) => ({
	root: {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [{ type: "text", text }],
			},
		],
	},
});

test("tree history restores an edit and a deleted node across reloads", async ({
	page,
	orpcClient,
}) => {
	const before = await orpcClient.premium.get();
	if (!before.isPremium) await orpcClient.premium.requestSeat();
	const scratchNode = await orpcClient.nodes.create({ parentId: null });

	try {
		const edited = await orpcClient.nodes.create({
			parentId: scratchNode.id,
		});
		await orpcClient.nodes.updateContent({
			id: edited.id,
			content: content("first version"),
		});
		await orpcClient.nodes.updateContent({
			id: edited.id,
			content: content("second version"),
		});

		const deleted = await orpcClient.nodes.create({
			parentId: scratchNode.id,
		});
		await orpcClient.nodes.updateContent({
			id: deleted.id,
			content: content("deleted child"),
		});
		await orpcClient.nodes.delete({ id: deleted.id });

		await page.goto("/");
		await page.getByRole("button", { name: "User menu" }).click();
		await page.getByRole("menuitem", { name: "Tree history" }).click();

		await page
			.getByRole("button", { name: /Edited content · second version/ })
			.click();
		await page.getByRole("button", { name: "Restore" }).click();
		await expect(page.getByText("History entry restored")).toBeVisible();
		expect(await orpcClient.nodes.get({ id: edited.id })).toMatchObject({
			content: content("first version"),
		});

		await page.getByRole("button", { name: /Deleted · deleted child/ }).click();
		await page.getByRole("button", { name: "Restore" }).click();
		await expect(page.getByText("History entry restored")).toBeVisible();

		await page.reload();
		const children = await orpcClient.nodes.list({
			parentId: scratchNode.id,
		});
		expect(children.map(({ id }) => id)).toContain(deleted.id);
	} finally {
		await orpcClient.nodes.delete({ id: scratchNode.id });
		if (!before.isPremium) await orpcClient.premium.revokeSeat();
	}
});
