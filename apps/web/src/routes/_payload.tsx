import { payloadLayoutRoute } from "@payloadcms/tanstack-start/client";
import { createFileRoute } from "@tanstack/react-router";
import "@payloadcms/ui/scss/app.scss";

import {
	getLayoutDataFn,
	serverFunctionHandler,
} from "./_payload/server.functions";

export const Route = createFileRoute("/_payload")(
	// @ts-expect-error — Payload's route options (beta) don't match TanStack
	// Start's stricter loader/staleReloadMode generics in this version pairing.
	payloadLayoutRoute({
		load: getLayoutDataFn,
		serverFunction: serverFunctionHandler,
	}),
);
