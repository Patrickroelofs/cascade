import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { cascadeServerPlugin } from "./src/core/cascade-server-plugin";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	plugins: [
		cascadeServerPlugin(),
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
