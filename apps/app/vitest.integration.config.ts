import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Integration tests hit a real Postgres (node procedures depend on recursive
 * CTEs, advisory locks, and COLLATE "C" semantics that in-memory fakes can't
 * reproduce). Point DATABASE_URL at a throwaway database; migrations run in
 * global setup. Kept separate from `vitest run` so unit tests stay DB-free.
 */
const DATABASE_URL =
	process.env.DATABASE_URL ??
	"postgres://postgres:postgres@localhost:5432/cascade_test";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		include: ["src/**/*.integration.test.ts"],
		globalSetup: "./src/test/integration-global-setup.ts",
		// Test files share one database; run them sequentially.
		fileParallelism: false,
		env: {
			DATABASE_URL,
			BETTER_AUTH_SECRET: "integration-test-secret-0123456789abcdef",
			BETTER_AUTH_URL: "http://localhost:3001",
		},
	},
});
