import type { Plugin } from "vite";

/**
 * Vite plugin that makes `?cascade-server` imports SSR-only.
 *
 * In client builds the import resolves to an empty module.
 * In SSR builds it resolves to the real module (suffix is stripped).
 *
 * Usage in feature files:
 *   schema:     () => import("./schema?cascade-server"),
 *   procedures: () => import("./procedures?cascade-server"),
 */
export function cascadeServerPlugin(): Plugin {
	let isSsr = false;
	return {
		name: "cascade-server",
		config(_, { isSsrBuild }) {
			isSsr = !!isSsrBuild;
		},
		resolveId(id, importer) {
			if (!id.endsWith("?cascade-server")) return;
			if (isSsr)
				return this.resolve(id.replace("?cascade-server", ""), importer);
			return "\0cascade-server-empty";
		},
		load(id) {
			if (id === "\0cascade-server-empty") return "export default {};";
		},
	};
}
