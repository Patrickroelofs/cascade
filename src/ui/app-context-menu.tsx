import {
	InfoIcon,
	KeyboardIcon,
	MagnifyingGlassIcon,
	MagnifyingGlassMinusIcon,
	MagnifyingGlassPlusIcon,
	PlusIcon,
} from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/ui/context-menu";

export function AppContextMenu({ children }: { children: ReactNode }) {
	return (
		<ContextMenu>
			<ContextMenuTrigger className="block min-h-dvh">
				{children}
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem icon={<MagnifyingGlassIcon size={14} weight="bold" />}>
					Search…
				</ContextMenuItem>
				<ContextMenuItem icon={<PlusIcon size={14} weight="bold" />}>
					New node
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuSub>
					<ContextMenuSubTrigger>View</ContextMenuSubTrigger>
					<ContextMenuSubContent>
						<ContextMenuItem
							icon={<MagnifyingGlassPlusIcon size={14} weight="bold" />}
						>
							Zoom in
						</ContextMenuItem>
						<ContextMenuItem
							icon={<MagnifyingGlassMinusIcon size={14} weight="bold" />}
						>
							Zoom out
						</ContextMenuItem>
						<ContextMenuItem>Reset zoom</ContextMenuItem>
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuSeparator />
				<ContextMenuItem icon={<KeyboardIcon size={14} weight="bold" />}>
					Keyboard shortcuts
				</ContextMenuItem>
				<ContextMenuItem icon={<InfoIcon size={14} weight="bold" />}>
					About Cascade
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
