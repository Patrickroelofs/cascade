import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getSession } from "#/integrations/better-auth/auth.functions";
import { orpc } from "#/orpc/client";
import { NodeList } from "#/ui/patterns/node-list/node-list";

export const Route = createFileRoute("/node/$nodeId")({
	beforeLoad: async () => {
		const session = await getSession();

		return { user: session!.user };
	},
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			orpc.getNode.queryOptions({ input: { id: params.nodeId } }),
		);
	},
	component: NoteZoomPage,
});

function NoteZoomPage() {
	const { nodeId } = Route.useParams();
	const { data } = useSuspenseQuery(
		orpc.getNode.queryOptions({ input: { id: nodeId } }),
	);

	return (
		<div className="max-w-6xl mx-auto py-10">
			<div
				className="text-xl font-semibold mb-4"
				style={{ viewTransitionName: `node-text-${nodeId}` }}
			>
				{data.text}
			</div>
			<NodeList nodes={data.children} withTransition />
		</div>
	);
}
