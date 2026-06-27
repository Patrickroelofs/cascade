import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "#/integrations/better-auth/auth.functions";
import { orpc } from "#/orpc/client";
import { NodeTree } from "#/ui/patterns/node-tree/node-tree";

export const Route = createFileRoute("/node/")({
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) throw redirect({ to: "/" });
		return { user: session.user };
	},
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(orpc.listNodes.queryOptions());
	},
	component: NoteZoomPage,
});

function NoteZoomPage() {
	const { data } = useSuspenseQuery(orpc.listNodes.queryOptions());

	return (
		<div className="max-w-6xl mx-auto py-10">
			<NodeTree roots={data} withTransition />
		</div>
	);
}
