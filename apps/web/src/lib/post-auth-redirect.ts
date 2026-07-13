import { appUrl } from "#/lib/app-url";

/**
 * Where to send the user after email sign-in/sign-up. When an OAuth
 * authorization is in progress (an MCP client connecting), the server
 * responds with the URL that resumes it (consent page or the client's
 * redirect_uri); otherwise fall back to the app.
 */
export function postAuthRedirect(data: unknown): string {
	if (
		data !== null &&
		typeof data === "object" &&
		"url" in data &&
		typeof data.url === "string" &&
		data.url.length > 0
	) {
		return data.url;
	}
	return appUrl;
}
