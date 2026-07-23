import { z } from "zod";
import { db } from "@/db";
import {
	captureSubtree,
	createHistoryRecorder,
	historyNodeLabel,
} from "@/features/tree-history/server/history-persistence";
import { authed } from "@/orpc/context";
import { dueDateSchema } from "../../model/due-date.schema";
import { nodeColumns } from "../persistence/node-columns";
import { nodes } from "../persistence/node-tables";
import {
	lockNodeOrdering,
	orderAtTarget,
	siblingScope,
} from "../persistence/sibling-order";

export const createNode = authed
	.errors({
		NOT_FOUND: {
			status: 404,
			message: "Anchor node is not a child of the requested parent",
		},
	})
	.input(
		z.object({
			parentId: z.string().nullable(),
			afterId: z.string().nullable().optional(),
			dueDate: dueDateSchema.nullable().optional(),
		}),
	)
	.handler(async ({ input, context, errors }) => {
		const userId = context.user.id;
		return db.transaction(async (transaction) => {
			await lockNodeOrdering(transaction, userId);
			const history = await createHistoryRecorder(transaction, userId);
			const target = input.afterId
				? { position: "after" as const, targetId: input.afterId }
				: { position: "append" as const };
			const order = await orderAtTarget(
				transaction,
				siblingScope(userId, input.parentId),
				target,
				false,
			);
			if (order === undefined) throw errors.NOT_FOUND();

			const [created] = await transaction
				.insert(nodes)
				.values({
					parentId: input.parentId,
					order,
					userId,
					dueDate: input.dueDate ?? null,
				})
				.returning(nodeColumns(userId));
			if (created) {
				await history.record({
					nodeId: created.id,
					payload: {
						kind: "node_created",
						label: historyNodeLabel(created.content),
					},
					snapshots: history.enabled
						? await captureSubtree(transaction, created.id, userId, "after")
						: [],
				});
			}
			return created;
		});
	});
