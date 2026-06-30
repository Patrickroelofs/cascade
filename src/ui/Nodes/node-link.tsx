import { Link } from "@tanstack/react-router";
import type { NodeProps } from "#/ui/Nodes/node";

interface NodeLinkProps extends Pick<NodeProps, "id"> {}

export function NodeLink({ id }: NodeLinkProps) {
	return (
		<Link
			to="/node/$nodeId"
			params={{ nodeId: id }}
			viewTransition
			className="w-2 h-2 rounded-full bg-dark-grey hover:bg-redleather transition-colors shrink-0"
		/>
	);
}
