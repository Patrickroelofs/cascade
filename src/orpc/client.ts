import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type router from "#/orpc/router";

const url =
	typeof window !== "undefined"
		? `${window.location.origin}/api/rpc`
		: `http://localhost:${process.env.PORT ?? 3000}/api/rpc`;

export const client = createORPCClient<RouterClient<typeof router>>(
	new RPCLink({ url }),
);

export const orpc = createTanstackQueryUtils(client);
