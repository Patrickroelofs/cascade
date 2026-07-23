import { createFileRoute } from "@tanstack/react-router";
import { handleTreeHistoryPurgeRequest } from "@/features/tree-history/server/tree-history-purge-api";

export const Route = createFileRoute("/api/maintenance/purge-tree-history")({
	server: {
		handlers: {
			POST: ({ request }) => handleTreeHistoryPurgeRequest(request),
		},
	},
});
