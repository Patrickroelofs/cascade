import { test } from "@playwright/test";
import { ensureTestUser, signInTestUser } from "./support/auth";
import { authFile } from "./support/env";

/**
 * Runs once (the "setup" project in playwright.config.ts) before every real
 * test project. Logs in through the same REST endpoints a browser would
 * hit, then persists the resulting session cookie so every other test
 * reuses it instead of signing in per-test.
 */
test("authenticate as the e2e test user", async ({ page }) => {
	await ensureTestUser(page.request);
	await signInTestUser(page.request);
	await page.context().storageState({ path: authFile });
});
