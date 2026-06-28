import { Menu } from "@base-ui/react/menu";
import { TrashIcon } from "@phosphor-icons/react/ssr";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "#/orpc/client";

export function DeleteNodeMenuItem({
	nodeId,
	nodeParentId,
}: {
	nodeId: string;
	nodeParentId: string | null;
}) {
	const queryClient = useQueryClient();
	const { mutate: deleteNode } = useMutation({
		...orpc.deleteNode.mutationOptions(),
		onSuccess: () => {
			if (nodeParentId) {
				queryClient.invalidateQueries(
					orpc.getChildren.queryOptions({ input: { parentId: nodeParentId } }),
				);
			} else {
				queryClient.invalidateQueries(orpc.listNodes.queryOptions());
			}
		},
	});

	return (
		<Menu.Item
			className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
			onClick={() => deleteNode({ id: nodeId })}
		>
			<TrashIcon size={14} />
			Delete
		</Menu.Item>
	);
}
