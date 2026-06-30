import { type QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { orpc } from "#/orpc/client";

export const nodeListLoader = async ({
	context,
}: {
	context: { queryClient: QueryClient };
}) => {
	return await context.queryClient.ensureQueryData(
		orpc.listNodes.queryOptions(),
	);
};

export const Route = createFileRoute("/")({
	component: () => {
		const { data } = useSuspenseQuery(orpc.listNodes.queryOptions());

		return (
			<div>
				<ul>
					{data.map((i) => {
						return (
							<li key={i.id}>
								<p>{i.text}</p>
							</li>
						);
					})}
				</ul>
			</div>
		);
	},
});
