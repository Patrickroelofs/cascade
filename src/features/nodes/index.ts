import { defineFeature } from "#/core/feature";

export const nodesFeature = defineFeature({
	name: "nodes",
	description: "Hierarchical tree node management",
	schema: () => import("./schema?cascade-server"),
	procedures: () => import("./procedures?cascade-server"),
	dependencies: ["auth"],
});
