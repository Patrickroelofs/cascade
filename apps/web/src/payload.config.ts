import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Media } from "#/collections/media";
import { Pages } from "#/collections/pages";
import { Users } from "#/collections/users";
import { env } from "#/env";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
	admin: {
		importMap: {
			baseDir: dirname,
			// TanStack Start has no Next.js `app/(payload)/admin` folder for the
			// CLI to discover, so point `payload generate:importmap` here directly.
			importMapFile: path.resolve(dirname, "importMap.js"),
		},
		user: Users.slug,
	},
	collections: [Pages, Media, Users],
	db: postgresAdapter({
		pool: {
			connectionString: env.DATABASE_URL,
		},
		// Keep Payload's tables out of the `public` schema apps/app's Drizzle
		// migrations own, since both connect to the same Postgres database.
		schemaName: "payload",
	}),
	secret: env.PAYLOAD_SECRET,
	sharp,
	typescript: {
		outputFile: path.resolve(dirname, "payload-types.ts"),
	},
});
