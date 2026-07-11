import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import * as schema from "./auth.schema";

const envSchema = z.object({
	DATABASE_URL: z.url(),
	BETTER_AUTH_URL: z.url(),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_GITHUB_CLIENT_ID: z.string().optional(),
	BETTER_AUTH_GITHUB_CLIENT_SECRET: z.string().optional(),
	BETTER_AUTH_GOOGLE_CLIENT_ID: z.string().optional(),
	BETTER_AUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
	// Set to ".cascadelist.com" in production so the session cookie spans
	// cascadelist.com and app.cascadelist.com; leave unset in dev.
	COOKIE_DOMAIN: z.string().optional(),
	// Comma-separated origins allowed to make authenticated cross-origin
	// requests. Defaults below cover local dev and cascadelist.com.
	TRUSTED_ORIGINS: z.string().optional(),
});

const env = envSchema.parse(
	Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== "")),
);

const db = drizzle(postgres(env.DATABASE_URL), { schema });

// A provider is only offered when both halves of its credentials are set;
// otherwise better-auth would register it and fail at sign-in time.
const socialProviders = {
	...(env.BETTER_AUTH_GITHUB_CLIENT_ID &&
		env.BETTER_AUTH_GITHUB_CLIENT_SECRET && {
			github: {
				clientId: env.BETTER_AUTH_GITHUB_CLIENT_ID,
				clientSecret: env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
			},
		}),
	...(env.BETTER_AUTH_GOOGLE_CLIENT_ID &&
		env.BETTER_AUTH_GOOGLE_CLIENT_SECRET && {
			google: {
				clientId: env.BETTER_AUTH_GOOGLE_CLIENT_ID,
				clientSecret: env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
			},
		}),
};

const trustedOrigins = env.TRUSTED_ORIGINS
	? env.TRUSTED_ORIGINS.split(",").map((origin) => origin.trim())
	: [
			"http://localhost:3000",
			"http://localhost:3001",
			"https://cascadelist.com",
			"https://app.cascadelist.com",
		];

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: "pg", schema }),
	emailAndPassword: {
		enabled: true,
	},
	user: {
		deleteUser: {
			enabled: true,
		},
	},
	socialProviders,
	trustedOrigins,
	advanced: {
		...(env.COOKIE_DOMAIN && {
			crossSubDomainCookies: {
				enabled: true,
				domain: env.COOKIE_DOMAIN,
			},
		}),
	},
});

export type Session = typeof auth.$Infer.Session;
