import type { CollectionConfig } from "payload";

import { authenticated } from "#/access/authenticated";
import { authenticatedOrPublished } from "#/access/authenticated-or-published";
import { defaultLexical } from "#/fields/default-lexical";

export const Pages: CollectionConfig = {
	slug: "pages",
	access: {
		create: authenticated,
		delete: authenticated,
		read: authenticatedOrPublished,
		update: authenticated,
	},
	admin: {
		defaultColumns: ["title", "slug", "updatedAt"],
		useAsTitle: "title",
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
		},
		{
			name: "content",
			type: "richText",
			editor: defaultLexical,
		},
		{
			name: "slug",
			type: "slug",
			useAsSlug: "title",
		},
		{
			name: "publishedAt",
			type: "date",
			admin: {
				position: "sidebar",
			},
		},
	],
	versions: {
		drafts: true,
	},
};
