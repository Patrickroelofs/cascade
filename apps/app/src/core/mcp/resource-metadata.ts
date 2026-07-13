import { env } from "@/env";

const webUrl = env.VITE_WEB_URL ?? "https://cascadelist.com";

/**
 * RFC 9728 protected resource metadata for the MCP endpoint. MCP clients
 * find this via the WWW-Authenticate challenge on /api/mcp, then discover
 * the authorization server (apps/web) from it.
 */
const metadata = {
	resource: `${env.BETTER_AUTH_URL}/api/mcp`,
	authorization_servers: [`${webUrl}/api/auth`],
	bearer_methods_supported: ["header"],
	scopes_supported: ["openid", "profile", "email", "offline_access"],
};

export function protectedResourceMetadataResponse(): Response {
	return new Response(JSON.stringify(metadata), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=15, stale-while-revalidate=15",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}

export function corsPreflightResponse(): Response {
	return new Response(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
	});
}
