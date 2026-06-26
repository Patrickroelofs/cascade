import type { TreeNode } from "#/db/schema";
import { NodeItem } from "#/ui/patterns/node-item/node-item";

export function NodeList({
	nodes,
	withTransition,
}: {
	nodes: TreeNode[];
	withTransition?: boolean;
}) {
	if (nodes.length === 0) return null;

	return (
		<div className="pl-4 border-l border-gray-200 ml-1">
			{nodes.map((node) => (
				<NodeItem key={node.id} node={node} withTransition={withTransition} />
			))}
		</div>
	);
}
