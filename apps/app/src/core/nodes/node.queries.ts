import { type SQL, sql } from "drizzle-orm";
import { nodes } from "@/core/nodes/node.schema";

export const hasChildren = sql<boolean>`EXISTS (SELECT 1 FROM nodes c WHERE c.parent_id = nodes.id AND c.user_id = nodes.user_id)`;

/**
 * Serialize structural tree mutations (create/move) per user. Trees are
 * single-owner, so one advisory lock per user is enough to make the
 * fractional-order computation and the move cycle check race-free without
 * blocking other users. Released automatically at transaction end.
 */
export async function acquireTreeLock(
	tx: { execute: (query: SQL) => Promise<unknown> },
	userId: string,
): Promise<void> {
	await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))`);
}

export const nodeColumns = {
	id: nodes.id,
	parentId: nodes.parentId,
	content: nodes.content,
	type: nodes.type,
	metadata: nodes.metadata,
	expanded: nodes.expanded,
	order: nodes.order,
	hasChildren,
};
