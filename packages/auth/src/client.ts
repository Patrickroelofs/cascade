import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { createAuthClient } from "better-auth/react";

// The oauth-provider client plugin forwards the signed OAuth query (added to
// the login/consent page URLs by the server) on sign-in and consent requests,
// so an in-progress MCP client authorization resumes after login.
export const authClient = createAuthClient({
	plugins: [oauthProviderClient()],
});
