import { ORPCError, os } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as z from "zod";

import { db } from "#/db";
import { nodes, type NodeType, type TreeNode } from "#/db/schema";
import { auth } from "#/integrations/better-auth/auth";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

const authedProcedure = os
	.$context<{ session?: Session | null }>()
	.use(({ context, next }) => {
		if (!context.session) throw new ORPCError("UNAUTHORIZED");
		return next({ context });
	});

function buildTree(flat: NodeType[], rootId: string | null = null): TreeNode[] {
	const map = new Map(flat.map((n) => [n.id, { ...n, children: [] as TreeNode[] }]));
	const roots: TreeNode[] = [];
	for (const node of map.values()) {
		if (node.parentId === rootId) roots.push(node);
		else map.get(node.parentId!)?.children.push(node);
	}
	const sort = (ns: TreeNode[]) => {
		ns.sort((a, b) => a.position - b.position);
		ns.forEach((n) => sort(n.children));
	};
	sort(roots);
	return roots;
}

export const listNodes = authedProcedure.handler(async () => {
	return buildTree(await db.select().from(nodes));
});

export const getNode = authedProcedure
	.input(z.object({ id: z.string() }))
	.handler(async ({ input }) => {
		const flat = await db.select().from(nodes);
		const node = flat.find((n) => n.id === input.id);
		if (!node) throw new ORPCError("NOT_FOUND");
		return { ...node, children: buildTree(flat, input.id) };
	});

export const addNode = authedProcedure
	.input(
		z.object({
			parentId: z.string().nullable(),
			position: z.number(),
			text: z.string(),
		}),
	)
	.handler(async ({ input }) => {
		const [row] = await db
			.insert(nodes)
			.values({ ...input, id: crypto.randomUUID() })
			.returning();
		return row;
	});

export const updateNode = authedProcedure
	.input(
		z.object({
			id: z.string(),
			text: z.string().optional(),
			position: z.number().optional(),
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

export const deleteNode = authedProcedure
	.input(z.object({ id: z.string() }))
	.handler(async ({ input }) => {
		const [row] = await db.delete(nodes).where(eq(nodes.id, input.id)).returning();
		return row;
	});
