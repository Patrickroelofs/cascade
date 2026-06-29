import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { orpc } from "#/orpc/client";
import { useInlineEdit } from "#/ui/hooks/use-inline-edit";

export function EditableTreeNodeText({
	nodeId,
	text,
	parentId,
	withTransition,
}: {
	nodeId: string;
	text: string;
	parentId: string | null;
	withTransition?: boolean;
}) {
	const queryClient = useQueryClient();
	const [isEditing, setIsEditing] = useState(false);
	const clickAt = useRef<{ x: number; y: number } | undefined>(undefined);
	const { mutate: updateNode } = useMutation(orpc.updateNode.mutationOptions());

	const queryOptions = parentId
		? orpc.getChildren.queryOptions({ input: { parentId } })
		: orpc.listNodes.queryOptions();

	const { mountRef, handleKeyDown, handleBlur } = useInlineEdit({
		clickAt: clickAt.current,
		onSave: (value) => {
			const trimmed = value.trim();
			if (trimmed && trimmed !== text) {
				queryClient.setQueryData(queryOptions.queryKey, (old) =>
					old?.map((n) => (n.id === nodeId ? { ...n, text: trimmed } : n)),
				);
				updateNode(
					{ id: nodeId, text: trimmed },
					{ onSettled: () => queryClient.invalidateQueries(queryOptions) },
				);
			}
			setIsEditing(false);
		},
		onCancel: () => setIsEditing(false),
	});

	const style = withTransition
		? { viewTransitionName: `node-text-${nodeId}` }
		: undefined;

	if (isEditing) {
		return (
			// biome-ignore lint/a11y/noStaticElementInteractions: contenteditable is interactive
			<div
				ref={mountRef}
				contentEditable
				suppressContentEditableWarning
				className="outline-none wrap-break-word min-w-4 inline-flex"
				style={style}
				onKeyDown={handleKeyDown}
				onBlur={handleBlur}
			>
				{text}
			</div>
		);
	}

	return (
		// biome-ignore lint/a11y/useSemanticElements: div is used for interaction
		<div
			className="outline-none wrap-break-word cursor-text text-left inline-flex"
			role="button"
			tabIndex={0}
			style={style}
			onClick={(e) => {
				clickAt.current = { x: e.clientX, y: e.clientY };
				setIsEditing(true);
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter") setIsEditing(true);
			}}
		>
			{text}
		</div>
	);
}
