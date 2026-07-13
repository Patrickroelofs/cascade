import { createFileRoute } from "@tanstack/react-router";
import {
	corsPreflightResponse,
	protectedResourceMetadataResponse,
} from "@/core/mcp/resource-metadata";

export const Route = createFileRoute("/.well-known/oauth-protected-resource")({
	server: {
		handlers: {
			GET: () => protectedResourceMetadataResponse(),
			OPTIONS: () => corsPreflightResponse(),
		},
	},
});
