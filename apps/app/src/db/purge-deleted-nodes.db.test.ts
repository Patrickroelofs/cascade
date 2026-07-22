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

describe("purgeDeletedNodes", () => {
	it("permanently removes a deleted node immediately, regardless of how recently it was deleted", async () => {
		const node = await call(createNode, { parentId: null }, { context });
		await call(deleteNode, { id: node.id }, { context });

		const { purgedIds } = await purgeDeletedNodes();

		expect(purgedIds).toContain(node.id);
		const [row] = await db.select().from(nodes).where(eq(nodes.id, node.id));
		expect(row).toBeUndefined();
	});

	it("permanently removes a whole deleted subtree", async () => {
		const parent = await call(createNode, { parentId: null }, { context });
		const child = await call(createNode, { parentId: parent.id }, { context });
		await call(deleteNode, { id: parent.id }, { context });

		const { purgedIds } = await purgeDeletedNodes();

		expect(purgedIds.sort()).toEqual([parent.id, child.id].sort());
		const remaining = await db
			.select()
			.from(nodes)
			.where(eq(nodes.userId, userId));
		expect(remaining).toHaveLength(0);
	});

	it("dry run reports what would be purged without deleting anything", async () => {
		const node = await call(createNode, { parentId: null }, { context });
		await call(deleteNode, { id: node.id }, { context });

		const { purgedIds } = await purgeDeletedNodes(/* dryRun */ true);

		expect(purgedIds).toContain(node.id);
		const [row] = await db.select().from(nodes).where(eq(nodes.id, node.id));
		expect(row).toBeDefined();
	});

	it("never touches active nodes", async () => {
		const node = await call(createNode, { parentId: null }, { context });

		await purgeDeletedNodes();

		const rows = await call(listNodes, { parentId: null }, { context });
		expect(rows.map((row) => row.id)).toContain(node.id);
	});
});
