import { os } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { db } from "#/db";
import { nodes } from "#/features/nodes/schema";

export const updateNode = os
	.input(
		z.object({
			id: z.string(),
			text: z.string().optional(),
			position: z.number().optional(),
			isOpen: z.boolean().optional(),
		}),
	)
	.handler(async ({ input }) => {
		const { id, ...patch } = input;
		const [row] = await db
			.update(nodes)
			.set(patch)
			.where(eq(nodes.id, id))
			.returning();
		return row;
	});
