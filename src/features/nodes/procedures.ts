import { ORPCError, os } from "@orpc/server";
import { eq, isNull, sql } from "drizzle-orm";
import * as z from "zod";

import { db } from "#/db";
import { nodes } from "./schema";

const hasChildrenExpr = sql<boolean>`EXISTS(SELECT 1 FROM nodes AS c WHERE c.parent_id = nodes.id)`;

export const listNodes = os.handler(async () => {
	return db
		.select({
			id: nodes.id,
			parentId: nodes.parentId,
			position: nodes.position,
			text: nodes.text,
			isOpen: nodes.isOpen,
			hasChildren: hasChildrenExpr,
		})
		.from(nodes)
		.where(isNull(nodes.parentId))
		.orderBy(nodes.position);
});

export const getChildren = os
	.input(z.object({ parentId: z.string() }))
	.handler(async ({ input }) => {
		return db
			.select({
				id: nodes.id,
				parentId: nodes.parentId,
				position: nodes.position,
				text: nodes.text,
				isOpen: nodes.isOpen,
				hasChildren: hasChildrenExpr,
			})
			.from(nodes)
			.where(eq(nodes.parentId, input.parentId))
			.orderBy(nodes.position);
	});

export const getNode = os
	.input(z.object({ id: z.string() }))
	.handler(async ({ input }) => {
		const [node] = await db
			.select()
			.from(nodes)
			.where(eq(nodes.id, input.id))
			.limit(1);
		if (!node) throw new ORPCError("NOT_FOUND");
		const children = await db
			.select({
				id: nodes.id,
				parentId: nodes.parentId,
				position: nodes.position,
				text: nodes.text,
				isOpen: nodes.isOpen,
				hasChildren: hasChildrenExpr,
			})
			.from(nodes)
			.where(eq(nodes.parentId, input.id))
			.orderBy(nodes.position);
		return { ...node, children };
	});
