import type { InferSelectModel } from "drizzle-orm";
import type { nodes } from "#/core/nodes/node.schema";
import type { LexicalElementNode } from "#/ui/Nodes/lexical-read-view";

export type NodeType = InferSelectModel<typeof nodes> & {
	hasChildren: boolean;
};
