import { oauthProvider } from "@better-auth/oauth-provider";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./auth.schema";

function required(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} is not set`);
	}
	return value;
}

const db = drizzle(postgres(required("DATABASE_URL")), { schema });

// Set to ".cascadelist.com" in production so the session cookie spans
// cascadelist.com and app.cascadelist.com; leave unset in dev.
const cookieDomain = process.env.COOKIE_DOMAIN;

// The outliner app's origin, which hosts the MCP endpoint that OAuth access
// tokens are minted for. On apps/web VITE_APP_URL points at it; on apps/app
// BETTER_AUTH_URL is already the app's own origin.
const appOrigin = process.env.VITE_APP_URL ?? required("BETTER_AUTH_URL");

export const auth = betterAuth({
	baseURL: required("BETTER_AUTH_URL"),
	secret: required("BETTER_AUTH_SECRET"),
	database: drizzleAdapter(db, { provider: "pg", schema }),
	emailAndPassword: {
		enabled: true,
	},
	user: {
		deleteUser: {
			enabled: true,
		},
	},
	socialProviders: {
		github: {
			clientId: process.env.BETTER_AUTH_GITHUB_CLIENT_ID as string,
			clientSecret: process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET as string,
		},
		google: {
			clientId: process.env.BETTER_AUTH_GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET as string,
		},
	},
	trustedOrigins: [
		"http://localhost:3000",
		"http://localhost:3001",
		"https://cascadelist.com",
		"https://app.cascadelist.com",
	],
	advanced: {
		...(cookieDomain && {
			crossSubDomainCookies: {
				enabled: true,
				domain: cookieDomain,
			},
		}),
	},
	plugins: [
		jwt(),
		// Makes this server an OAuth 2.1 authorization server so MCP clients
		// can authenticate. The login/consent pages live in apps/web, so only
		// that deployment's authorization endpoints are advertised (see the
		// well-known routes in apps/web); apps/app verifies the issued JWTs
		// on its /api/mcp endpoint.
		oauthProvider({
			loginPage: "/login",
			consentPage: "/oauth/consent",
			allowDynamicClientRegistration: true,
			allowUnauthenticatedClientRegistration: true,
			validAudiences: [`${appOrigin}/api/mcp`],
			// Discovery is served by dedicated routes (apps/web root
			// .well-known routes and the app's protected-resource route).
			silenceWarnings: {
				oauthAuthServerConfig: true,
				openidConfig: true,
			},
		}),
	],
});

export type Session = typeof auth.$Infer.Session;
