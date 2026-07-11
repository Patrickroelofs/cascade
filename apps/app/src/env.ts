import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.url(),
		PORT: z.coerce.number().int().positive().default(3000),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		BETTER_AUTH_GITHUB_CLIENT_ID: z.string().optional(),
		BETTER_AUTH_GITHUB_CLIENT_SECRET: z.string().optional(),
		BETTER_AUTH_GOOGLE_CLIENT_ID: z.string().optional(),
		BETTER_AUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
		COOKIE_DOMAIN: z.string().optional(),
		/** Comma-separated origins; see @cascade/auth server. */
		TRUSTED_ORIGINS: z.string().optional(),
		LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
