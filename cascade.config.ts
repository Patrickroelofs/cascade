import { defineConfig } from "#/core/config";
import { deleteNodeFeature } from "#/features/delete-node";
import { nodesFeature } from "#/features/nodes";

export default defineConfig({
	features: [nodesFeature, deleteNodeFeature],
});
