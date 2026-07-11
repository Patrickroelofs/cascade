import { randomUUID } from "node:crypto";
import { user } from "@cascade/auth/schema";
import { call } from "@orpc/server";
import { inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import {
	createNode,
	deleteNode,
	getNode,
	moveNode,
	setNodeType,
	toggleNodeExpanded,
	updateNodeContent,
	visibleTree,
} from "@/core/nodes/node.procedures";
import { nodes } from "@/core/nodes/node.schema";
import { db } from "@/db";
import type { ORPCContext } from "@/orpc/context";

const createdUserIds: string[] = [];

async function makeUser(): Promise<string> {
	const id = randomUUID();
	await db.insert(user).values({
		id,
		name: "Integration Test",
		email: `${id}@test.local`,
	});
	createdUserIds.push(id);
	return id;
}

/** authed only reads context.session.user, so a stub session suffices. */
function asUser(userId: string) {
	return {
		context: {
			request: new Request("http://test.local"),
			session: { user: { id: userId } } as ORPCContext["session"],
		},
	};
}

afterAll(async () => {
	// Node rows cascade from the user FK.
	await db.delete(user).where(inArray(user.id, createdUserIds));
});

describe("createNode concurrency", () => {
	it("gives concurrent creates against the same anchor distinct orders", async () => {
		const userId = await makeUser();
		const opts = asUser(userId);
		const anchor = await call(createNode, { parentId: null }, opts);
		const tail = await call(createNode, { parentId: null }, opts);

		const created = await Promise.all(
			Array.from({ length: 5 }, () =>
				call(createNode, { parentId: null, afterId: anchor.id }, opts),
			),
		);

		const orders = created.map((n) => n.order);
		expect(new Set(orders).size).toBe(5);
		for (const order of orders) {
			expect(order > anchor.order).toBe(true);
			expect(order < tail.order).toBe(true);
		}
	});

	it("enforces sibling order uniqueness at the database level", async () => {
		const userId = await makeUser();
		await db.insert(nodes).values({ parentId: null, order: "dup", userId });
		// Drizzle wraps the postgres error; the constraint name is on the cause.
		const error = await db
			.insert(nodes)
			.values({ parentId: null, order: "dup", userId })
			.then(
				() => null,
				(e: unknown) => e,
			);
		expect(String((error as Error)?.cause ?? error)).toContain(
			"nodes_user_parent_order_uq",
		);
	});
});

describe("moveNode concurrency", () => {
	it("rejects one of two reciprocal moves instead of creating a cycle", async () => {
		const userId = await makeUser();
		const opts = asUser(userId);
		const a = await call(createNode, { parentId: null }, opts);
		const b = await call(createNode, { parentId: null }, opts);

		const results = await Promise.allSettled([
			call(moveNode, { id: a.id, parentId: b.id, position: "append" }, opts),
			call(moveNode, { id: b.id, parentId: a.id, position: "append" }, opts),
		]);

		expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
		const rejected = results.find((r) => r.status === "rejected");
		expect(rejected && "reason" in rejected && rejected.reason).toMatchObject({
			code: "INVALID_MOVE",
		});

		// Walk up from both nodes: parent chains must terminate at a root.
		for (const start of [a.id, b.id]) {
			let current: string | null = start;
			for (let hops = 0; current !== null; hops++) {
				expect(hops).toBeLessThan(10);
				// Annotated to break the current -> input -> output inference cycle.
				const node: { parentId: string | null } = await call(
					getNode,
					{ id: current },
					opts,
				);
				current = node.parentId;
			}
		}
	});
});

describe("deleteNode", () => {
	it("reports the exact number of cascade-deleted descendants", async () => {
		const userId = await makeUser();
		const opts = asUser(userId);
		const parent = await call(createNode, { parentId: null }, opts);
		const child1 = await call(createNode, { parentId: parent.id }, opts);
		await call(createNode, { parentId: parent.id }, opts);
		await call(createNode, { parentId: child1.id }, opts);

		const result = await call(deleteNode, { id: parent.id }, opts);
		expect(result.childrenDeleted).toBe(3);
		await expect(call(getNode, { id: parent.id }, opts)).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});

	it("404s on a missing node", async () => {
		const userId = await makeUser();
		await expect(
			call(deleteNode, { id: randomUUID() }, asUser(userId)),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});

describe("visibleTree pagination", () => {
	it('pages mixed-case sibling orders in byte order (COLLATE "C")', async () => {
		const userId = await makeUser();
		const opts = asUser(userId);
		// Byte order puts all uppercase before all lowercase; ICU/locale
		// collations interleave them, which would corrupt cursor paging.
		const orders = ["B", "a", "Z", "b", "A", "z"];
		await db
			.insert(nodes)
			.values(orders.map((order) => ({ parentId: null, order, userId })));

		const seen: string[] = [];
		let cursor: string[] | null = null;
		for (let pages = 0; pages < 10; pages++) {
			// Annotated to break the cursor -> input -> output inference cycle.
			const page: {
				rows: { order: string }[];
				nextCursor: string[] | null;
			} = await call(visibleTree, { rootId: null, cursor, limit: 2 }, opts);
			seen.push(...page.rows.map((r) => r.order));
			cursor = page.nextCursor;
			if (cursor === null) break;
		}

		expect(seen).toEqual(["A", "B", "Z", "a", "b", "z"]);
	});
});

describe("mutation 404 consistency", () => {
	it("404s instead of silently no-oping on missing ids", async () => {
		const userId = await makeUser();
		const opts = asUser(userId);
		const missing = randomUUID();

		await expect(
			call(toggleNodeExpanded, { id: missing, expanded: true }, opts),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
		await expect(
			call(
				setNodeType,
				{ id: missing, type: "task", metadata: { completed: false } },
				opts,
			),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
		await expect(
			call(
				updateNodeContent,
				{ id: missing, content: { root: { type: "root" } } },
				opts,
			),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	it("hides other users' nodes behind the same 404", async () => {
		const owner = await makeUser();
		const intruder = await makeUser();
		const node = await call(createNode, { parentId: null }, asUser(owner));

		await expect(
			call(
				toggleNodeExpanded,
				{ id: node.id, expanded: true },
				asUser(intruder),
			),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});
