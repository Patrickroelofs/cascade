import { os } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { db } from "#/db";
import { nodes } from "#/features/nodes/schema";

export const deleteNode = os
	.input(z.object({ id: z.string() }))
	.handler(async ({ input }) => {
		const [row] = await db
			.delete(nodes)
			.where(eq(nodes.id, input.id))
			.returning();
		return row;
	});
