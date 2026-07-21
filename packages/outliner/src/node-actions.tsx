import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@cascade/ui/context-menu";
import { ArrowsClockwiseIcon, TrashIcon } from "@phosphor-icons/react/ssr";
import { Fragment, type ReactNode } from "react";
import { useOutlinerLabels } from "./labels-context";
import { type NodeTypeName, nodeTypeNames } from "./node-types";

interface NodeActionsProps {
	nodeType: NodeTypeName;
	onConvert: (type: NodeTypeName) => void;
	onDelete: () => void;
	/** Feature-contributed menu entries (due date, tags, …), rendered in
	 * order before the core "Convert into"/"Delete" entries. */
	menuItems: { id: string; node: ReactNode }[];
	viewTransitionName?: string;
	children: ReactNode;
}

export function NodeActions({
	nodeType,
	onConvert,
	onDelete,
	menuItems,
	viewTransitionName,
	children,
}: NodeActionsProps) {
	const labels = useOutlinerLabels();
	return (
		<ContextMenu>
			<ContextMenuTrigger
				style={{ viewTransitionName }}
				className="flex items-center gap-2 min-w-0 flex-1"
				onTouchStart={(e) => e.stopPropagation()}
				onContextMenu={(e) => e.stopPropagation()}
			>
				{children}
			</ContextMenuTrigger>
			<ContextMenuContent>
				{menuItems.map(({ id, node }) => (
					<Fragment key={id}>
						{node}
						<ContextMenuSeparator />
					</Fragment>
				))}
				<ContextMenuSub>
					<ContextMenuSubTrigger
						icon={<ArrowsClockwiseIcon size={14} weight="bold" />}
					>
						{labels.convertInto}
					</ContextMenuSubTrigger>
					<ContextMenuSubContent>
						{nodeTypeNames
							.filter((type) => type !== nodeType)
							.map((type) => (
								<ContextMenuItem key={type} onClick={() => onConvert(type)}>
									{labels.nodeTypeLabels[type]}
								</ContextMenuItem>
							))}
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuSeparator />
				<ContextMenuItem
					variant="destructive"
					icon={<TrashIcon size={14} weight="bold" />}
					onClick={onDelete}
				>
					{labels.delete}
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
