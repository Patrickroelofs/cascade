import type { CollectionConfig } from "payload";

import { authenticated } from "#/access/authenticated";
import { authenticatedOrPublished } from "#/access/authenticated-or-published";

export const Media: CollectionConfig = {
	slug: "media",
	access: {
		create: authenticated,
		delete: authenticated,
		read: authenticatedOrPublished,
		update: authenticated,
	},
	admin: {
		useAsTitle: "alt",
	},
	fields: [
		{
			name: "alt",
			type: "text",
			required: true,
		},
	],
	upload: {
		staticDir: "media",
		mimeTypes: ["image/*"],
	},
};
