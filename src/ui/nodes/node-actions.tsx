import { ContextMenu } from "@base-ui/react";
import { TrashIcon } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";

interface NodeActionsProps {
	onDelete: () => void;
	viewTransitionName?: string;
	children: ReactNode;
}

export function NodeActions({
	onDelete,
	viewTransitionName,
	children,
}: NodeActionsProps) {
	return (
		<ContextMenu.Root>
			<ContextMenu.Trigger
				className="flex items-center gap-2 min-w-0 flex-1"
				style={{ viewTransitionName }}
			>
				{children}
			</ContextMenu.Trigger>
			<ContextMenu.Portal>
				<ContextMenu.Positioner className="z-50 outline-none">
					<ContextMenu.Popup className="origin-[var(--transform-origin)] min-w-40 rounded-lg border border-dark-grey/10 bg-white p-1 text-dark-grey shadow-lg shadow-dark-grey/15 transition-[transform,opacity] duration-150 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
						<ContextMenu.Item
							className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-redleather outline-none data-[highlighted]:bg-ginger/70"
							onClick={onDelete}
						>
							<TrashIcon size={14} weight="bold" />
							Delete
						</ContextMenu.Item>
					</ContextMenu.Popup>
				</ContextMenu.Positioner>
			</ContextMenu.Portal>
		</ContextMenu.Root>
	);
}
