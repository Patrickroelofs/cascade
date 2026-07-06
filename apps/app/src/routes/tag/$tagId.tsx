import { HouseIcon } from "@phosphor-icons/react/ssr";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { orpc } from "@/orpc/client";
import { GenericErrorComponent } from "@/ui/error/generic-error";
import { toLexicalContent } from "@/ui/lexical/lexical-content";
import { LexicalReadView } from "@/ui/lexical/read/lexical-read-view";

export const Route = createFileRoute("/tag/$tagId")({
	loader: ({ context: { queryClient }, params: { tagId } }) =>
		Promise.all([
			queryClient.ensureQueryData(
				orpc.tags.get.queryOptions({ input: { id: tagId } }),
			),
			queryClient.ensureQueryData(
				orpc.tags.nodesForTag.queryOptions({ input: { tagId, cursor: null } }),
			),
		]),
	errorComponent: GenericErrorComponent,
	component: TagFilterPage,
});

function TagFilterPage() {
	const { tagId } = Route.useParams();
	const queryClient = useQueryClient();
	const { data: tag } = useSuspenseQuery(
		orpc.tags.get.queryOptions({ input: { id: tagId } }),
	);
	const { data } = useSuspenseQuery(
		orpc.tags.nodesForTag.queryOptions({ input: { tagId, cursor: null } }),
	);

	const [rows, setRows] = useState(data.rows);
	const [nextCursor, setNextCursor] = useState(data.nextCursor);
	const [loadingMore, setLoadingMore] = useState(false);

	const loadMore = async () => {
		if (!nextCursor || loadingMore) return;
		setLoadingMore(true);
		try {
			const next = await queryClient.fetchQuery(
				orpc.tags.nodesForTag.queryOptions({
					input: { tagId, cursor: nextCursor },
				}),
			);
			setRows((r) => [...r, ...next.rows]);
			setNextCursor(next.nextCursor);
		} finally {
			setLoadingMore(false);
		}
	};

	return (
		<div className="max-w-6xl mx-auto px-4 py-12 sm:py-32">
			<nav aria-label="Breadcrumb" className="mb-4 text-sm">
				<Link
					to="/"
					viewTransition
					aria-label="Home"
					className="hover:text-redleather transition-colors"
				>
					<HouseIcon size={16} weight="bold" />
				</Link>
			</nav>
			<div className="text-2xl mb-8 flex items-center gap-3">
				<span
					aria-hidden
					className="block size-4 rounded-full shrink-0"
					style={{ backgroundColor: tag.color }}
				/>
				{tag.name}
			</div>
			{rows.length === 0 ? (
				<p className="text-sm py-4">
					No nodes are tagged with &quot;{tag.name}&quot; yet.
				</p>
			) : (
				<ul className="flex flex-col gap-2">
					{rows.map((node) => (
						<li key={node.id}>
							<Link
								to="/node/$nodeId"
								params={{ nodeId: node.id }}
								viewTransition
								className="group flex items-center gap-2"
							>
								<span
									aria-hidden
									className="relative z-0 w-2 h-2 rounded-full bg-dark-grey group-hover:bg-redleather dark:bg-ginger dark:group-hover:bg-redleather shrink-0 transition-all"
								/>
								<span className="block w-full min-w-0 group-hover:opacity-80 transition-opacity">
									<LexicalReadView content={toLexicalContent(node.content)} />
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
			{nextCursor && (
				<button
					type="button"
					onClick={loadMore}
					disabled={loadingMore}
					className="mt-4 text-sm underline outline-none focus-visible:ring-2 focus-visible:ring-redleather/50 disabled:opacity-50"
				>
					{loadingMore ? "Loading…" : "Load more"}
				</button>
			)}
		</div>
	);
}
