import { defineFeature } from "#/core/feature";

const procedures = import.meta.env.SSR ? await import("./procedures") : undefined;
const schema = import.meta.env.SSR ? await import("./schema") : undefined;

export const nodesFeature = defineFeature({
	name: "nodes",
	description: "Hierarchical tree node management",
	schema,
	procedures,
	dependencies: ["auth"],
});
