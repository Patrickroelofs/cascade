import { payloadAdminSplatRoute } from "@payloadcms/tanstack-start/client";
import { createFileRoute } from "@tanstack/react-router";

import { loadAdminPageRSC } from "./server.functions";

export const Route = createFileRoute("/_payload/admin/$")(
	// @ts-expect-error — Payload's route options (beta) don't match TanStack
	// Start's stricter loader/staleReloadMode generics in this version pairing.
	payloadAdminSplatRoute({ load: loadAdminPageRSC }),
);
