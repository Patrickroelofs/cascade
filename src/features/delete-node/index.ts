import { defineFeature } from "#/core/feature";
import { DeleteNodeMenuItem } from "./components/delete-node-menu-item";

const procedures = import.meta.env.SSR ? await import("./procedures") : undefined;

export const deleteNodeFeature = defineFeature({
	name: "delete-node",
	description: "Delete a node and its children",
	procedures,
	dependencies: ["nodes"],
	slots: {
		afterNodeActions: [DeleteNodeMenuItem],
	},
});
