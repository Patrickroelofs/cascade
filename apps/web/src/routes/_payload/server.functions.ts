import { createServerFunctionClient } from "@payloadcms/tanstack-start/client";
import { createServerFn } from "@tanstack/react-start";
import type { ServerFunctionClientArgs } from "payload";

type LoadInput = {
	_splat?: string;
	search?: Record<string, string | string[]>;
};

// Single injection point for the app-owned config + generated importMap,
// shared by all three server functions below.
const getConfig = async () => (await import("@payload-config")).default;
const getImportMap = async () => (await import("#/importMap.js")).importMap;

export const loadAdminPageRSC = createServerFn({ method: "GET" })
	.validator((data: LoadInput): LoadInput => data ?? {})
	// @ts-expect-error — TanStack Start's serializable-return check rejects the RSC
	// payload `loadAdminPage` returns; Payload's own demo has the same shape (beta).
	.handler(async ({ data }) => {
		const { loadAdminPage } = await import("@payloadcms/tanstack-start/server");
		return loadAdminPage({
			config: await getConfig(),
			importMap: await getImportMap(),
			search: data.search,
			splat: data._splat,
		});
	});

export const getLayoutDataFn = createServerFn({ method: "GET" })
	// @ts-expect-error — same serializable-return friction as `loadAdminPageRSC` above.
	.handler(async () => {
		const { loadLayoutData } = await import(
			"@payloadcms/tanstack-start/layouts"
		);
		return loadLayoutData({
			config: await getConfig(),
			importMap: await getImportMap(),
		});
	});

const runPayloadServerFn = createServerFn({ method: "POST" })
	.validator((args: ServerFunctionClientArgs): ServerFunctionClientArgs => args)
	// @ts-expect-error — same serializable-return friction as `loadAdminPageRSC` above.
	.handler(async ({ data }) => {
		const { handleServerFunctions } = await import(
			"@payloadcms/tanstack-start/server"
		);
		return await handleServerFunctions({
			args: data.args,
			config: await getConfig(),
			importMap: await getImportMap(),
			name: data.name,
		});
	});

// `createServerFunctionClient` sanitizes args for TanStack Start's seroval
// wire format before dispatching through `runPayloadServerFn`.
export const serverFunctionHandler = createServerFunctionClient({
	runServerFn: runPayloadServerFn,
});
