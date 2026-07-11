/// <reference types="vitest/config" />
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		// Integration tests need a database; they run via vitest.integration.config.ts.
		exclude: ["**/node_modules/**", "**/e2e/**", "**/*.integration.test.ts"],
	},
	plugins: [
		devtools(),
		nitro(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		babel({
			presets: [reactCompilerPreset()],
		}),
	],
});
