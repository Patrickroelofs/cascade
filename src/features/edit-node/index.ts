import { defineFeature } from "#/core/feature";
import { EditableTreeNodeText } from "./components/editable-tree-node-text";

export const editNodeFeature = defineFeature({
	name: "edit-node",
	description: "Edit node title inline",
	procedures: () => import("./procedures?cascade-server"),
	dependencies: ["nodes"],
	slots: {
		nodeText: [EditableTreeNodeText],
	},
});
