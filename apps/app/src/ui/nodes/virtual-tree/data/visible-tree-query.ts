import { orpc } from "@/orpc/client";

export function visibleTreeOptions(rootId: string | null) {
	return orpc.nodes.visibleTree.queryOptions({ input: { rootId } });
}
