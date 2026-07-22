import { call } from "@orpc/server";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	createNode,
	deleteNode,
	listNodes,
} from "@/core/nodes/node.procedures";
import { nodes } from "@/core/nodes/node.schema";
import { db } from "@/db";
import { purgeDeletedNodes } from "@/db/purge-deleted-nodes";
import type { ORPCContext } from "@/orpc/context";
import { createTestUser, deleteTestUser } from "@/test-db/harness";

let userId: string;
let context: ORPCContext;

beforeEach(async () => {
	const testUser = await createTestUser();
	userId = testUser.user.id;
	context = testUser.context;
});

afterEach(async () => {
	await deleteTestUser(userId);
});

/** Backdates a row's `deletedAt` past the retention window, simulating time
 * having passed since `deleteNode` stamped it with "now". */
async function backdateDeletion(nodeId: string, daysAgo: number) {
	await db
		.update(nodes)
		.set({ deletedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000) })
		.where(eq(nodes.id, nodeId));
}

describe("purgeDeletedNodes", () => {
	it("leaves recently deleted nodes alone", async () => {
		const node = await call(createNode, { parentId: null }, { context });
		await call(deleteNode, { id: node.id }, { context });

		const { purgedIds } = await purgeDeletedNodes(30);

		expect(purgedIds).not.toContain(node.id);
		const [row] = await db.select().from(nodes).where(eq(nodes.id, node.id));
		expect(row).toBeDefined();
	});

	it("permanently removes a whole subtree once it's past the retention window", async () => {
		const parent = await call(createNode, { parentId: null }, { context });
		const child = await call(createNode, { parentId: parent.id }, { context });
		await call(deleteNode, { id: parent.id }, { context });
		await backdateDeletion(parent.id, 31);
		await backdateDeletion(child.id, 31);

		const { purgedIds } = await purgeDeletedNodes(30);

		expect(purgedIds.sort()).toEqual([parent.id, child.id].sort());
		const remaining = await db
			.select()
			.from(nodes)
			.where(eq(nodes.userId, userId));
		expect(remaining).toHaveLength(0);
	});

	it("respects a custom retention window", async () => {
		const node = await call(createNode, { parentId: null }, { context });
		await call(deleteNode, { id: node.id }, { context });
		await backdateDeletion(node.id, 8);

		expect((await purgeDeletedNodes(30)).purgedIds).not.toContain(node.id);
		expect((await purgeDeletedNodes(7)).purgedIds).toContain(node.id);
	});

	it("dry run reports what would be purged without deleting anything", async () => {
		const node = await call(createNode, { parentId: null }, { context });
		await call(deleteNode, { id: node.id }, { context });
		await backdateDeletion(node.id, 31);

		const { purgedIds } = await purgeDeletedNodes(30, /* dryRun */ true);

		expect(purgedIds).toContain(node.id);
		const [row] = await db.select().from(nodes).where(eq(nodes.id, node.id));
		expect(row).toBeDefined();
	});

	it("never touches active nodes", async () => {
		const node = await call(createNode, { parentId: null }, { context });

		await purgeDeletedNodes(0);

		const rows = await call(listNodes, { parentId: null }, { context });
		expect(rows.map((row) => row.id)).toContain(node.id);
	});
});
