import { mcpHandler } from "@better-auth/oauth-provider";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createFileRoute } from "@tanstack/react-router";
import {
	createCascadeMcpServer,
	createMcpSession,
} from "@/core/mcp/mcp.server";
import { env } from "@/env";
import { logger } from "@/lib/logger";

// This endpoint is the OAuth protected resource; access tokens are minted
// for it as audience. Tokens are issued by apps/web, which hosts the login
// and consent pages, and verified here against this app's JWKS (both apps
// share the same database, and therefore the same signing keys).
const resource = `${env.BETTER_AUTH_URL}/api/mcp`;
const webUrl = env.VITE_WEB_URL ?? "https://cascadelist.com";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
	"Access-Control-Allow-Headers":
		"Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id",
	"Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
};

function withCors(response: Response): Response {
	const headers = new Headers(response.headers);
	for (const [key, value] of Object.entries(CORS_HEADERS)) {
		headers.set(key, value);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

const handleMcp = mcpHandler(
	{
		jwksUrl: `${env.BETTER_AUTH_URL}/api/auth/jwks`,
		verifyOptions: {
			issuer: `${webUrl}/api/auth`,
			audience: resource,
		},
	},
	async (request, jwt) => {
		const expiresAt = jwt.exp ? new Date(jwt.exp * 1000) : new Date();
		const session =
			typeof jwt.sub === "string"
				? await createMcpSession(jwt.sub, expiresAt)
				: null;
		if (!session) {
			return new Response("Unauthorized", { status: 401 });
		}

		// Stateless mode: a fresh server and transport per request, so no
		// session affinity is needed across requests or server instances.
		const server = createCascadeMcpServer(request, session);
		const transport = new WebStandardStreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
			enableJsonResponse: true,
		});
		await server.connect(transport);
		return transport.handleRequest(request);
	},
);

async function handle({ request }: { request: Request }) {
	try {
		return withCors(await handleMcp(request));
	} catch (error) {
		logger.error("mcp handler error", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		return withCors(new Response("Internal Server Error", { status: 500 }));
	}
}

export const Route = createFileRoute("/api/mcp")({
	server: {
		handlers: {
			OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
			GET: handle,
			POST: handle,
			DELETE: handle,
		},
	},
});
