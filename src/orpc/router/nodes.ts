import { ORPCError, os } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as z from "zod";

import { db } from "#/db";
import { nodes, type NodeType, type TreeNode } from "#/db/schema";

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

export const listNodes = os.handler(() => {
	return buildTree(db.select().from(nodes).all());
});

export const getNode = os
	.input(z.object({ id: z.string() }))
	.handler(({ input }) => {
		const flat = db.select().from(nodes).all();
		const node = flat.find((n) => n.id === input.id);
		if (!node) throw new ORPCError("NOT_FOUND");
		return { ...node, children: buildTree(flat, input.id) };
	});

export const addNode = os
	.input(
		z.object({
			parentId: z.string().nullable(),
			position: z.number(),
			text: z.string(),
		}),
	)
	.handler(({ input }) => {
		return db
			.insert(nodes)
			.values({ ...input, id: crypto.randomUUID() })
			.returning()
			.get();
	});

export const updateNode = os
	.input(
		z.object({
			id: z.string(),
			text: z.string().optional(),
			position: z.number().optional(),
		}),
	)
	.handler(({ input }) => {
		const { id, ...patch } = input;
		return db
			.update(nodes)
			.set(patch)
			.where(eq(nodes.id, id))
			.returning()
			.get();
	});

export const deleteNode = os
	.input(z.object({ id: z.string() }))
	.handler(({ input }) => {
		return db.delete(nodes).where(eq(nodes.id, input.id)).returning().get();
	});
