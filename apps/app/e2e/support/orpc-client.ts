import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { BrowserContext } from "@playwright/test";
import type router from "@/orpc/router";
import { env } from "./env";

export type OrpcClient = RouterClient<typeof router>;

async function cookieHeaderFor(context: BrowserContext): Promise<string> {
	const cookies = await context.cookies();
	return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

/**
 * A fully-typed oRPC client (same router types the app itself uses) that
 * authenticates as whichever user `context` is currently logged in as. Lets
 * tests seed/verify data through the real API instead of duplicating the
 * RPC wire format or reaching into the database directly.
 */
export function createOrpcClient(context: BrowserContext): OrpcClient {
	const link = new RPCLink({
		url: `${env.appUrl}/api/rpc`,
		headers: async () => {
			const cookie = await cookieHeaderFor(context);
			return cookie ? { cookie } : {};
		},
	});
	return createORPCClient(link);
}
