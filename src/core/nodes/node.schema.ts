import {
	type AnyPgColumn,
	boolean,
	index,
	jsonb,
	pgTable,
	text,
} from "drizzle-orm/pg-core";

export const nodes = pgTable(
	"nodes",
	{
		id: text().primaryKey(),
		parentId: text("parent_id").references((): AnyPgColumn => nodes.id, {
			onDelete: "cascade",
		}),
		content: jsonb("content"),
		expanded: boolean().notNull().default(false),
		order: text("order"),
	},
	(t) => [index("nodes_parent_id_idx").on(t.parentId)],
);
