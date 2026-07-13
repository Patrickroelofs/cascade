import {
	authServerMetadataHandler,
	discoveryPreflight,
} from "@cascade/auth/discovery";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.well-known/oauth-authorization-server")(
	{
		server: {
			handlers: {
				GET: ({ request }: { request: Request }) =>
					authServerMetadataHandler(request),
				OPTIONS: () => discoveryPreflight(),
			},
		},
	},
);
