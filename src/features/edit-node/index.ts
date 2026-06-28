import { defineFeature } from "#/core/feature";
import { EditableTreeNodeText } from "./components/editable-tree-node-text";

const procedures = import.meta.env.SSR
	? await import("./procedures")
	: undefined;

export const editNodeFeature = defineFeature({
	name: "edit-node",
	description: "Edit node title inline",
	procedures,
	dependencies: ["nodes"],
	slots: {
		nodeText: [EditableTreeNodeText],
	},
});
