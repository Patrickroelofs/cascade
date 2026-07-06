import { z } from "zod";

/**
 * Single source of truth for node types. Adding a type = one entry here plus
 * one member in `typedMetadataSchema` and a render branch in the tree row.
 */
export const nodeTypeDefs = {
	text: {
		label: "Text",
		metadataSchema: z.null(),
		defaultMetadata: null,
	},
	task: {
		label: "Task",
		metadataSchema: z.object({ completed: z.boolean() }),
		defaultMetadata: { completed: false },
	},
} as const satisfies Record<
	string,
	{ label: string; metadataSchema: z.ZodType; defaultMetadata: unknown }
>;

export type NodeTypeName = keyof typeof nodeTypeDefs;

export type NodeMetadataOf<T extends NodeTypeName> = z.infer<
	(typeof nodeTypeDefs)[T]["metadataSchema"]
>;

export const nodeTypeNames = Object.keys(nodeTypeDefs) as NodeTypeName[];

export const typedMetadataSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("text"), metadata: z.null() }),
	z.object({
		type: z.literal("task"),
		metadata: nodeTypeDefs.task.metadataSchema,
	}),
]);

export type TypedMetadata = z.infer<typeof typedMetadataSchema>;
