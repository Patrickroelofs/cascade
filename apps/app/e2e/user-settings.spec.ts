import { expect, test } from "./support/fixtures";

test("theme choice persists to the account and applies on a device with no local state", async ({
	page,
	orpcClient,
}) => {
	const before = await orpcClient.settings.get();
	// Merge-only updates can't delete keys, so restore the equivalent of the
	// previous state (a legacy `dark` flag maps to the built-in themes).
	const restoreTheme =
		before.theme ?? ((before.dark ?? false) ? "dark" : "light");
	const target = restoreTheme === "dracula" ? "nord" : "dracula";
	const targetLabel = target === "dracula" ? "Dracula" : "Nord";

	try {
		await page.goto("/");
		await page.getByRole("button", { name: "User menu" }).click();
		await page.getByRole("menuitem", { name: "Settings" }).click();
		await page.getByRole("combobox", { name: "Theme" }).click();
		await page.getByRole("option", { name: targetLabel }).click();

		// The theme applies immediately, before it is even saved.
		await expect(page.locator("html")).toHaveAttribute("data-theme", target);

		// Closing the dialog is what saves the changes to the account.
		await page.getByRole("button", { name: "Close settings" }).click();

		// The change lands server-side, not just in this tab.
		await expect
			.poll(async () => (await orpcClient.settings.get()).theme)
			.toBe(target);

		// A reload gets the setting from the account (SSR'd, no local state).
		await page.reload();
		await expect(page.locator("html")).toHaveAttribute("data-theme", target);
		// Both candidate themes are dark, so the `dark` class must be SSR'd too.
		await expect
			.poll(() =>
				page.evaluate(() =>
					document.documentElement.classList.contains("dark"),
				),
			)
			.toBe(true);
	} finally {
		// Settings are user-wide state on the shared e2e user; put it back.
		await orpcClient.settings.update({ theme: restoreTheme });
	}
});
