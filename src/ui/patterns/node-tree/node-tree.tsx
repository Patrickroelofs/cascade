import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useState } from "react";
import type { NodeWithMeta } from "#/db/schema";
import { orpc } from "#/orpc/client";

// ponytail: module-level set survives SPA back-nav; use sessionStorage if refresh persistence matters
const openNodes = new Set<string>();

type FlatNode = { node: NodeWithMeta; depth: number };

function buildFlat(
	nodes: NodeWithMeta[],
	depth: number,
	openSet: Set<string>,
	childrenMap: Map<string, NodeWithMeta[]>,
): FlatNode[] {
	return nodes.flatMap((node) => {
		const children = openSet.has(node.id)
			? (childrenMap.get(node.id) ?? [])
			: [];
		return [
			{ node, depth },
			...buildFlat(children, depth + 1, openSet, childrenMap),
		];
	});
}

export function NodeTree({
	roots,
	withTransition,
}: {
	roots: NodeWithMeta[];
	withTransition?: boolean;
}) {
	const [openSet, setOpenSet] = useState(() => new Set(openNodes));

	const openIds = [...openSet];

	const childQueries = useQueries({
		queries: openIds.map((nodeId) =>
			orpc.getChildren.queryOptions({ input: { parentId: nodeId } }),
		),
	});

	const childrenMap = new Map(
		openIds.map((nodeId, i) => [nodeId, childQueries[i].data ?? []]),
	);

	const flatNodes = buildFlat(roots, 0, openSet, childrenMap);

	const virtualizer = useWindowVirtualizer({
		count: flatNodes.length,
		estimateSize: () => 32,
		overscan: 10,
	});

	const toggle = (nodeId: string) => {
		setOpenSet((prev) => {
			const next = new Set(prev);
			if (next.has(nodeId)) {
				next.delete(nodeId);
				openNodes.delete(nodeId);
			} else {
				next.add(nodeId);
				openNodes.add(nodeId);
			}
			return next;
		});
	};

	return (
		<div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
			{virtualizer.getVirtualItems().map((vItem) => {
				const { node, depth } = flatNodes[vItem.index];
				const isOpen = openSet.has(node.id);

				return (
					<div
						key={vItem.key}
						data-index={vItem.index}
						ref={virtualizer.measureElement}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							transform: `translateY(${vItem.start}px)`,
						}}
					>
						<div
							className="group/node py-1 flex items-center gap-2"
							style={{ paddingLeft: depth * 16 }}
						>
							{node.hasChildren ? (
								<button
									type="button"
									onClick={() => toggle(node.id)}
									className={`shrink-0 text-gray-400 hover:text-gray-700 transition-all opacity-0 group-hover/node:opacity-100 ${isOpen ? "rotate-90" : ""}`}
								>
									<CaretRightIcon size={12} weight="bold" />
								</button>
							) : (
								<span className="w-3 shrink-0" />
							)}

							<Link
								to="/node/$nodeId"
								params={{ nodeId: node.id }}
								viewTransition
								className="w-2 h-2 rounded-full bg-gray-400 hover:bg-black transition-colors shrink-0"
							/>

							<div
								className="flex-1 outline-none wrap-break-word"
								style={
									withTransition
										? { viewTransitionName: `node-text-${node.id}` }
										: undefined
								}
							>
								{node.text}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
