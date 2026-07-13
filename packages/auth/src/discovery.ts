import {
	oauthProviderAuthServerMetadata,
	oauthProviderOpenIdConfigMetadata,
} from "@better-auth/oauth-provider";
import { auth } from "./server";

// OAuth/OIDC discovery for MCP clients. better-auth serves these documents
// under its own base path (/api/auth), but clients resolve them from the
// site root per RFC 8414, so the root .well-known routes re-export them.
// CORS is wide open: the documents are public metadata and browser-based
// MCP clients fetch them cross-origin.
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

export const authServerMetadataHandler = oauthProviderAuthServerMetadata(auth, {
	headers: corsHeaders,
});

export const openIdConfigHandler = oauthProviderOpenIdConfigMetadata(auth, {
	headers: corsHeaders,
});

export function discoveryPreflight(): Response {
	return new Response(null, { status: 204, headers: corsHeaders });
}
