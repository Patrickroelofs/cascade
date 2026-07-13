import { user } from "@cascade/auth/schema";
import type { Session } from "@cascade/auth/server";
import { textToLexicalContent } from "@cascade/outliner/lexical-content";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createRouterClient, ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { nodeText, renderOutline } from "@/core/mcp/mcp.content";
import { db } from "@/db";
import type { ORPCContext } from "@/orpc/context";
import router from "@/orpc/router";

/**
 * Builds the session context for MCP calls from a verified OAuth access
 * token's subject. The session record is synthetic (there is no cookie
 * session behind a bearer token), but the user is real and every node
 * procedure only relies on `session.user`.
 */
export async function createMcpSession(
	userId: string,
	expiresAt: Date,
): Promise<Session | null> {
	const [found] = await db
		.select()
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	if (!found) return null;
	const now = new Date();
	return {
		user: found,
		session: {
			id: `mcp-${crypto.randomUUID()}`,
			token: "",
			userId: found.id,
			expiresAt,
			createdAt: now,
			updatedAt: now,
			ipAddress: null,
			userAgent: null,
		},
	};
}

function text(value: string): CallToolResult {
	return { content: [{ type: "text", text: value }] };
}

function json(value: unknown): CallToolResult {
	return text(JSON.stringify(value, null, 2));
}

/**
 * Wraps a tool handler so oRPC errors (NOT_FOUND, INVALID_MOVE, ...) surface
 * as tool errors the client can read instead of protocol-level failures.
 */
function run<Args>(
	handler: (args: Args) => Promise<CallToolResult>,
): (args: Args) => Promise<CallToolResult> {
	return async (args) => {
		try {
			return await handler(args);
		} catch (error) {
			if (error instanceof ORPCError) {
				return {
					isError: true,
					content: [{ type: "text", text: `${error.code}: ${error.message}` }],
				};
			}
			throw error;
		}
	};
}

const nodeTypeInput = {
	type: z
		.enum(["text", "task"])
		.describe("Node type: plain text or a task with a completed state"),
	completed: z
		.boolean()
		.optional()
		.describe("For task nodes: completed state (defaults to false)"),
};

function typedMetadata(type: "text" | "task", completed: boolean | undefined) {
	return type === "task"
		? ({ type, metadata: { completed: completed ?? false } } as const)
		: ({ type, metadata: null } as const);
}

/**
 * A per-request MCP server exposing the full outliner capability surface.
 * Tools call the existing oRPC procedures through a server-side client, so
 * authorization and validation behave exactly like the app.
 */
export function createCascadeMcpServer(
	request: Request,
	session: Session,
): McpServer {
	const client = createRouterClient(router, {
		context: { request, session } satisfies ORPCContext,
	});

	const server = new McpServer({ name: "cascade", version: "1.0.0" });

	server.registerTool(
		"get_outline",
		{
			description:
				"Read the outline as indented plain text, one node per line with its id. " +
				"Only visible nodes are returned: children of collapsed nodes are hidden " +
				"(marked '(children hidden)'; use list_nodes or set_expanded to reach them). " +
				"Pass rootId to read a subtree, omit it for the top level.",
			inputSchema: {
				rootId: z
					.string()
					.nullable()
					.default(null)
					.describe("Node id whose subtree to read, or null for the top level"),
				cursor: z
					.array(z.string())
					.nullable()
					.default(null)
					.describe("Pagination cursor from a previous call's nextCursor"),
				limit: z.number().int().min(1).max(2000).default(500),
			},
			annotations: { readOnlyHint: true },
		},
		run(async ({ rootId, cursor, limit }) => {
			const { rows, nextCursor } = await client.nodes.visibleTree({
				rootId,
				cursor,
				limit,
			});
			if (rows.length === 0) return text("(empty outline)");
			const outline = renderOutline(rows);
			return text(
				nextCursor
					? `${outline}\n\n(more nodes available; pass cursor ${JSON.stringify(nextCursor)} to continue)`
					: outline,
			);
		}),
	);

	server.registerTool(
		"list_nodes",
		{
			description:
				"List the direct children of a node (or the top-level nodes when parentId " +
				"is null), regardless of expansion state. Returns id, text, type, task " +
				"state, expansion state and whether each child has children of its own.",
			inputSchema: {
				parentId: z
					.string()
					.nullable()
					.default(null)
					.describe("Parent node id, or null for top-level nodes"),
			},
			annotations: { readOnlyHint: true },
		},
		run(async ({ parentId }) => {
			const rows = await client.nodes.list({ parentId });
			return json(
				rows.map((row) => ({
					id: row.id,
					text: nodeText(row.content),
					type: row.type,
					metadata: row.metadata,
					expanded: row.expanded,
					hasChildren: row.hasChildren,
				})),
			);
		}),
	);

	server.registerTool(
		"get_node",
		{
			description:
				"Read a single node: its text, type, task state, parent and whether it has children.",
			inputSchema: { id: z.string().describe("Node id") },
			annotations: { readOnlyHint: true },
		},
		run(async ({ id }) => {
			const node = await client.nodes.get({ id });
			return json({
				id: node.id,
				parentId: node.parentId,
				text: nodeText(node.content),
				type: node.type,
				metadata: node.metadata,
				expanded: node.expanded,
				hasChildren: node.hasChildren,
			});
		}),
	);

	server.registerTool(
		"get_ancestors",
		{
			description:
				"Read the ancestor chain (breadcrumb) of a node, from the top level down " +
				"to and including the node itself.",
			inputSchema: { id: z.string().describe("Node id") },
			annotations: { readOnlyHint: true },
		},
		run(async ({ id }) => {
			const chain = await client.nodes.ancestors({ id });
			return json(
				chain.map((node) => ({ id: node.id, text: nodeText(node.content) })),
			);
		}),
	);

	server.registerTool(
		"create_node",
		{
			description:
				"Create a node. Appends to the end of the parent's children unless afterId " +
				"places it after a specific sibling. Optionally sets its text and type in " +
				"the same call. Returns the new node's id.",
			inputSchema: {
				parentId: z
					.string()
					.nullable()
					.default(null)
					.describe("Parent node id, or null to create a top-level node"),
				afterId: z
					.string()
					.nullable()
					.optional()
					.describe("Sibling id to insert after (must share the same parent)"),
				text: z.string().optional().describe("Initial text content"),
				type: nodeTypeInput.type.optional(),
				completed: nodeTypeInput.completed,
			},
		},
		run(async ({ parentId, afterId, text: content, type, completed }) => {
			const created = await client.nodes.create({ parentId, afterId });
			if (content !== undefined && content.length > 0) {
				await client.nodes.updateContent({
					id: created.id,
					content: textToLexicalContent(content),
				});
			}
			if (type === "task") {
				await client.nodes.setType({
					id: created.id,
					...typedMetadata(type, completed),
				});
			}
			return json({ id: created.id, parentId: created.parentId });
		}),
	);

	server.registerTool(
		"update_node_text",
		{
			description:
				"Replace a node's text content. Note this overwrites any rich-text " +
				"formatting the node had.",
			inputSchema: {
				id: z.string().describe("Node id"),
				text: z.string().describe("New text content"),
			},
		},
		run(async ({ id, text: content }) => {
			await client.nodes.updateContent({
				id,
				content: textToLexicalContent(content),
			});
			return text("Updated.");
		}),
	);

	server.registerTool(
		"set_node_type",
		{
			description:
				"Change a node's type. Converting to task sets its completed state " +
				"(default false); use this to check or uncheck an existing task too.",
			inputSchema: { id: z.string().describe("Node id"), ...nodeTypeInput },
		},
		run(async ({ id, type, completed }) => {
			await client.nodes.setType({ id, ...typedMetadata(type, completed) });
			return text("Updated.");
		}),
	);

	server.registerTool(
		"move_node",
		{
			description:
				"Move a node (with its whole subtree) to a new parent and/or position. " +
				"position 'append' adds it as the last child of parentId; 'before'/'after' " +
				"place it relative to targetId, which must be a child of parentId. " +
				"A node cannot be moved into its own subtree.",
			inputSchema: {
				id: z.string().describe("Node id to move"),
				parentId: z
					.string()
					.nullable()
					.default(null)
					.describe("Destination parent id, or null for the top level"),
				position: z.enum(["before", "after", "append"]).default("append"),
				targetId: z
					.string()
					.optional()
					.describe("Sibling to position relative to (before/after only)"),
			},
		},
		run(async ({ id, parentId, position, targetId }) => {
			if (position === "append") {
				await client.nodes.move({ id, parentId, position });
			} else {
				if (!targetId) {
					return {
						isError: true,
						content: [
							{
								type: "text",
								text: `targetId is required when position is '${position}'`,
							},
						],
					};
				}
				await client.nodes.move({ id, parentId, position, targetId });
			}
			return text("Moved.");
		}),
	);

	server.registerTool(
		"set_expanded",
		{
			description:
				"Expand or collapse a node in the outline view. Collapsed nodes hide " +
				"their children from get_outline.",
			inputSchema: {
				id: z.string().describe("Node id"),
				expanded: z.boolean(),
			},
		},
		run(async ({ id, expanded }) => {
			await client.nodes.toggleExpanded({ id, expanded });
			return text(expanded ? "Expanded." : "Collapsed.");
		}),
	);

	server.registerTool(
		"delete_node",
		{
			description:
				"Delete a node AND all of its descendants. This cannot be undone.",
			inputSchema: { id: z.string().describe("Node id") },
			annotations: { destructiveHint: true },
		},
		run(async ({ id }) => {
			const { childrenDeleted } = await client.nodes.delete({ id });
			return text(
				`Deleted node and ${childrenDeleted} descendant node${childrenDeleted === 1 ? "" : "s"}.`,
			);
		}),
	);

	return server;
}
