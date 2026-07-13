import {
	discoveryPreflight,
	openIdConfigHandler,
} from "@cascade/auth/discovery";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.well-known/openid-configuration")({
	server: {
		handlers: {
			GET: ({ request }: { request: Request }) => openIdConfigHandler(request),
			OPTIONS: () => discoveryPreflight(),
		},
	},
});
