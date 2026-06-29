import { defineFeature } from "#/core/feature";
import { DeleteNodeMenuItem } from "./components/delete-node-menu-item";

export const deleteNodeFeature = defineFeature({
	name: "delete-node",
	description: "Delete a node and its children",
	procedures: () => import("./procedures?cascade-server"),
	dependencies: ["nodes"],
	slots: {
		afterNodeActions: [DeleteNodeMenuItem],
	},
});
