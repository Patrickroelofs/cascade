import { os } from "@orpc/server";
import { and, asc, desc, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { generateKeyBetween } from "fractional-indexing";
import { z } from "zod";
import { nodes } from "#/core/nodes/node.schema";
import { db } from "#/db";

export const listNodes = os
	.input(z.object({ parentId: z.string().nullable() }))
	.handler(async ({ input }) => {
		return db
			.select({
				id: nodes.id,
				parentId: nodes.parentId,
				content: nodes.content,
				expanded: nodes.expanded,
				order: nodes.order,
				hasChildren: sql<boolean>`EXISTS (SELECT 1 FROM nodes c WHERE c.parent_id = nodes.id)`,
			})
			.from(nodes)
			.where(
				input.parentId === null
					? isNull(nodes.parentId)
					: eq(nodes.parentId, input.parentId),
			)
			.orderBy(asc(nodes.order));
	});

export const getNode = os
	.input(z.object({ id: z.string() }))
	.handler(async ({ input }) => {
		const [node] = await db
			.select({
				id: nodes.id,
				parentId: nodes.parentId,
				content: nodes.content,
				expanded: nodes.expanded,
				order: nodes.order,
				hasChildren: sql<boolean>`EXISTS (SELECT 1 FROM nodes c WHERE c.parent_id = nodes.id)`,
			})
			.from(nodes)
			.where(eq(nodes.id, input.id))
			.limit(1);
		return node ?? null;
	});

export const toggleNodeExpanded = os
	.input(z.object({ id: z.string(), expanded: z.boolean() }))
	.handler(async ({ input }) => {
		await db
			.update(nodes)
			.set({ expanded: input.expanded })
			.where(eq(nodes.id, input.id));
	});

export const moveNode = os
	.input(
		z.object({
			id: z.string(),
			parentId: z.string().nullable(),
			position: z.enum(["before", "after", "append"]),
			targetId: z.string().nullable(),
		}),
	)
	.handler(async ({ input }) => {
		if (input.parentId) {
			const cycle = await db.execute(sql`
				WITH RECURSIVE ancestors AS (
					SELECT id, parent_id FROM nodes WHERE id = ${input.parentId}
					UNION ALL
					SELECT n.id, n.parent_id FROM nodes n JOIN ancestors a ON n.id = a.parent_id
				)
				SELECT 1 FROM ancestors WHERE id = ${input.id} LIMIT 1
			`);
			if (cycle.length > 0) return;
		}

		const parentFilter =
			input.parentId === null
				? isNull(nodes.parentId)
				: eq(nodes.parentId, input.parentId);

		let before: string | null = null;
		let after: string | null = null;

		if (input.position === "append") {
			const [last] = await db
				.select({ order: nodes.order })
				.from(nodes)
				.where(parentFilter)
				.orderBy(desc(nodes.order))
				.limit(1);
			before = last?.order ?? null;
		} else {
			const [target] = await db
				.select({ order: nodes.order })
				.from(nodes)
				.where(eq(nodes.id, input.targetId as string))
				.limit(1);
			if (input.position === "before") {
				const [prev] = await db
					.select({ order: nodes.order })
					.from(nodes)
					.where(and(parentFilter, lt(nodes.order, target.order as string)))
					.orderBy(desc(nodes.order))
					.limit(1);
				before = prev?.order ?? null;
				after = target.order;
			} else {
				const [next] = await db
					.select({ order: nodes.order })
					.from(nodes)
					.where(and(parentFilter, gt(nodes.order, target.order as string)))
					.orderBy(asc(nodes.order))
					.limit(1);
				before = target.order;
				after = next?.order ?? null;
			}
		}

		const order = generateKeyBetween(before, after);
		await db
			.update(nodes)
			.set({ parentId: input.parentId, order })
			.where(eq(nodes.id, input.id));
	});

export const deleteNode = os
	.input(z.object({ id: z.string() }))
	.handler(async ({ input }) => {
		await db.delete(nodes).where(eq(nodes.id, input.id));
	});

const lexicalTextNodeSchema = z
	.object({
		type: z.literal("text"),
		text: z.string(),
		format: z.number().optional(),
	})
	.passthrough();

const lexicalElementNodeSchema: z.ZodType<unknown> = z.lazy(() =>
	z
		.object({
			type: z.string(),
			children: z
				.array(z.union([lexicalTextNodeSchema, lexicalElementNodeSchema]))
				.optional(),
		})
		.passthrough(),
);

export const updateNodeContent = os
	.input(
		z.object({
			id: z.string(),
			content: z.object({ root: lexicalElementNodeSchema }),
		}),
	)
	.handler(async ({ input }) => {
		await db
			.update(nodes)
			.set({ content: input.content })
			.where(eq(nodes.id, input.id));
	});
