import path from "node:path";
import { fileURLToPath } from "node:url";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { withPayload } from "@payloadcms/tanstack-start/vite";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config = defineConfig(
	withPayload(
		({ pluginOptions }) => ({
			resolve: { tsconfigPaths: true },
			build: {
				rollupOptions: {
					onLog(level, log, handler) {
						if (log.code === "INVALID_ANNOTATION") return;
						handler(level, log);
					},
				},
			},
			plugins: [
				paraglideVitePlugin({
					project: "./project.inlang",
					outdir: "./src/paraglide",
					strategy: ["url", "cookie", "preferredLanguage", "baseLocale"],
					cookieName: "PARAGLIDE_LOCALE",
					emitTsDeclarations: true,
				}),
				devtools(),
				rsc(pluginOptions.rsc),
				tanstackStart(pluginOptions.tanstackStart),
				viteReact(pluginOptions.react),
				nitro(),
				tailwindcss(),
			],
		}),
		{
			payloadConfigPath: path.resolve(dirname, "src", "payload.config.ts"),
			// This app's file-based routes live in `src/routes` (the TanStack
			// Start default), not the `src/app` directory Payload's own demo uses.
			routesDirectory: "routes",
		},
	),
);

export default config;
