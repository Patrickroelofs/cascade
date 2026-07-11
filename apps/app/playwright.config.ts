import { defineConfig, devices } from "@playwright/test";
import { authFile } from "./e2e/support/env";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? "html" : "list",
	timeout: 30_000,
	expect: {
		timeout: 5_000,
	},
	use: {
		baseURL: "http://localhost:3001",
		trace: "on-first-retry",
	},
	projects: [
		{ name: "setup", testMatch: /auth\.setup\.ts/ },
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				storageState: authFile,
			},
			dependencies: ["setup"],
		},
	],
	webServer: {
		// `pnpm start` alone expects env vars from the deploy platform; locally
		// they live in .env.local, same as `pnpm dev`.
		command:
			"pnpm build && node --env-file=.env.local .output/server/index.mjs",
		url: "http://localhost:3001",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
