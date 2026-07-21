import { AlertDialog } from "@base-ui/react";
import { Calendar } from "@cascade/ui/calendar";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@cascade/ui/context-menu";
import {
	CalendarIcon,
	CheckSquareIcon,
	MinusIcon,
	ParagraphIcon,
	PlusIcon,
	TagIcon,
	TextHFiveIcon,
	TextHFourIcon,
	TextHOneIcon,
	TextHSixIcon,
	TextHThreeIcon,
	TextHTwoIcon,
	TrashIcon,
	XIcon,
} from "@phosphor-icons/react/ssr";
import { Fragment, type ReactNode, useState } from "react";
import { useOutlinerLabels } from "./labels-context";
import type { BlockType } from "./lexical/lexical-content";
import type { TagSummary } from "./node-tags";
import type { NodeTypeName } from "./node-types";

/** Every option in the merged "Convert into" menu: the row-level `task` type,
 * plus every Lexical block type ("text" is represented by `blockType`
 * "paragraph", so it isn't listed separately). */
type ConvertOption = "task" | BlockType;

/** Block-type options, grouped together and separated from `task` (a
 * different axis: the row type, not the content format) by a divider. */
const BLOCK_OPTIONS: BlockType[] = [
	"paragraph",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
];

const CONVERT_ICONS: Record<ConvertOption, ReactNode> = {
	paragraph: <ParagraphIcon size={14} weight="bold" />,
	task: <CheckSquareIcon size={14} weight="bold" />,
	h1: <TextHOneIcon size={14} weight="bold" />,
	h2: <TextHTwoIcon size={14} weight="bold" />,
	h3: <TextHThreeIcon size={14} weight="bold" />,
	h4: <TextHFourIcon size={14} weight="bold" />,
	h5: <TextHFiveIcon size={14} weight="bold" />,
	h6: <TextHSixIcon size={14} weight="bold" />,
};

export interface BulkSelectionActions {
	/** How many rows are currently selected, including this one. */
	count: number;
	existingTags: TagSummary[];
	onDelete: () => void;
	onAddTag: (tag: string) => void;
	onRemoveTag: (tag: string) => void;
	onSetDueDate: (date: Date | null) => void;
	onClear: () => void;
}

interface NodeActionsProps {
	nodeType: NodeTypeName;
	blockType: BlockType;
	onConvert: (type: NodeTypeName) => void;
	onTurnInto: (blockType: BlockType) => void;
	onDelete: () => void;
	/** Feature-contributed menu entries (due date, tags, …), rendered in
	 * order before the core "Convert into"/"Delete" entries. */
	menuItems: { id: string; node: ReactNode }[];
	viewTransitionName?: string;
	/** When this row is part of a multi-selection (more than one row
	 * selected), the context menu shows the selection's bulk actions instead
	 * of this row's own menu. */
	bulkSelection?: BulkSelectionActions;
	children: ReactNode;
}

/** Add-to-selection / remove-from-selection for one tag at a time: unlike
 * the per-node tag editor, a multi-selection has no single "current" tag
 * list to check boxes against, so this is a plain text field plus explicit
 * add/remove buttons. */
function BulkTagEditor({
	existingTags,
	onAdd,
	onRemove,
}: {
	existingTags: TagSummary[];
	onAdd: (tag: string) => void;
	onRemove: (tag: string) => void;
}) {
	const labels = useOutlinerLabels();
	const [query, setQuery] = useState("");
	const trimmed = query.trim();
	const matches =
		trimmed.length > 0
			? existingTags.filter((t) =>
					t.name.toLowerCase().includes(trimmed.toLowerCase()),
				)
			: existingTags;

	return (
		<div className="w-56">
			<input
				// biome-ignore lint/a11y/noAutofocus: opened via an explicit click, so autofocus doesn't steal focus from something the user was already doing
				autoFocus
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder={labels.bulkTagInputPlaceholder}
				className="mb-2 w-full rounded-md border border-ink/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/50 dark:border-surface/15"
				onClick={(e) => e.stopPropagation()}
			/>
			{matches.length > 0 && (
				<div className="mb-2 max-h-32 overflow-y-auto">
					{matches.map((tag) => (
						<button
							key={tag.name}
							type="button"
							onClick={() => setQuery(tag.name)}
							className="block w-full truncate rounded-md px-2 py-1 text-left text-sm hover:bg-surface/70 dark:hover:bg-surface/20"
						>
							{tag.name}
						</button>
					))}
				</div>
			)}
			<div className="flex gap-2">
				<button
					type="button"
					disabled={!trimmed}
					onClick={() => onAdd(trimmed)}
					className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md bg-ink/5 px-2 py-1.5 text-sm outline-none hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-default disabled:opacity-40 dark:bg-surface/10 dark:hover:bg-surface/20"
				>
					<PlusIcon size={12} weight="bold" />
					{labels.bulkAddTagAction}
				</button>
				<button
					type="button"
					disabled={!trimmed}
					onClick={() => onRemove(trimmed)}
					className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md bg-ink/5 px-2 py-1.5 text-sm outline-none hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-default disabled:opacity-40 dark:bg-surface/10 dark:hover:bg-surface/20"
				>
					<MinusIcon size={12} weight="bold" />
					{labels.bulkRemoveTagAction}
				</button>
			</div>
		</div>
	);
}

/** Rendered as a sibling of `ContextMenu`, not nested inside its popup: the
 * popup unmounts when the menu closes (which selecting "Delete" does), so
 * anything meant to persist past that has to live outside it. */
function BulkDeleteDialog({
	count,
	open,
	onOpenChange,
	onConfirm,
}: {
	count: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}) {
	const labels = useOutlinerLabels();
	return (
		<AlertDialog.Root open={open} onOpenChange={onOpenChange}>
			<AlertDialog.Portal>
				<AlertDialog.Backdrop className="fixed inset-0 z-50 bg-surface/20 backdrop-blur-sm" />
				<AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-ink/10 bg-white p-6 text-ink shadow-lg shadow-ink/15 outline-none dark:border-surface/15 dark:bg-ink dark:text-surface">
					<AlertDialog.Title className="text-lg font-semibold">
						{labels.bulkDeleteConfirmTitle(count)}
					</AlertDialog.Title>
					<AlertDialog.Description className="mt-2 text-sm text-ink dark:text-surface">
						{labels.bulkDeleteConfirmBody}
					</AlertDialog.Description>
					<div className="mt-6 flex justify-end gap-2">
						<AlertDialog.Close className="cursor-pointer rounded-md px-3 py-1.5 text-sm outline-none hover:bg-surface/70 focus-visible:ring-2 focus-visible:ring-danger/50 dark:hover:bg-surface/20">
							{labels.cancel}
						</AlertDialog.Close>
						<button
							type="button"
							onClick={() => {
								onConfirm();
								onOpenChange(false);
							}}
							className="cursor-pointer rounded-md bg-danger px-3 py-1.5 text-sm text-canvas outline-none hover:bg-danger/90 focus-visible:ring-2 focus-visible:ring-danger/50"
						>
							{labels.delete}
						</button>
					</div>
				</AlertDialog.Popup>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	);
}

export function NodeActions({
	nodeType,
	blockType,
	onConvert,
	onTurnInto,
	onDelete,
	menuItems,
	viewTransitionName,
	bulkSelection,
	children,
}: NodeActionsProps) {
	const labels = useOutlinerLabels();
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const currentOption: ConvertOption = nodeType === "task" ? "task" : blockType;

	function optionLabel(option: ConvertOption): string {
		if (option === "task") return labels.nodeTypeLabels.task;
		if (option === "paragraph") return labels.nodeTypeLabels.text;
		return labels.headingLabels[option];
	}

	function selectOption(option: ConvertOption) {
		if (option === "task") {
			onConvert("task");
			return;
		}
		onConvert("text");
		onTurnInto(option);
	}

	return (
		<>
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
					{bulkSelection ? (
						<>
							<ContextMenuLabel>
								{labels.selectionCount(bulkSelection.count)}
							</ContextMenuLabel>
							<ContextMenuSeparator />
							<ContextMenuSub>
								<ContextMenuSubTrigger
									icon={<TagIcon size={14} weight="bold" />}
									openOnHover
									delay={150}
								>
									{labels.bulkTagsTrigger}
								</ContextMenuSubTrigger>
								<ContextMenuSubContent>
									<BulkTagEditor
										existingTags={bulkSelection.existingTags}
										onAdd={bulkSelection.onAddTag}
										onRemove={bulkSelection.onRemoveTag}
									/>
								</ContextMenuSubContent>
							</ContextMenuSub>
							<ContextMenuSub>
								<ContextMenuSubTrigger
									icon={<CalendarIcon size={14} weight="bold" />}
									openOnHover
									delay={150}
								>
									{labels.bulkDueDateTrigger}
								</ContextMenuSubTrigger>
								<ContextMenuSubContent>
									<Calendar
										value={null}
										onSelect={bulkSelection.onSetDueDate}
										onClear={() => bulkSelection.onSetDueDate(null)}
									/>
								</ContextMenuSubContent>
							</ContextMenuSub>
							<ContextMenuSeparator />
							<ContextMenuItem
								variant="destructive"
								icon={<TrashIcon size={14} weight="bold" />}
								onClick={() => setDeleteConfirmOpen(true)}
							>
								{labels.bulkDeleteTrigger}
							</ContextMenuItem>
							<ContextMenuItem
								icon={<XIcon size={14} weight="bold" />}
								onClick={bulkSelection.onClear}
							>
								{labels.clearSelection}
							</ContextMenuItem>
						</>
					) : (
						<>
							{menuItems.map(({ id, node }) => (
								<Fragment key={id}>
									{node}
									<ContextMenuSeparator />
								</Fragment>
							))}
							<ContextMenuSub>
								<ContextMenuSubTrigger icon={CONVERT_ICONS[currentOption]}>
									{labels.convertInto}
								</ContextMenuSubTrigger>
								<ContextMenuSubContent>
									{BLOCK_OPTIONS.map((option) => (
										<ContextMenuItem
											key={option}
											icon={CONVERT_ICONS[option]}
											disabled={option === currentOption}
											onClick={() => selectOption(option)}
										>
											{optionLabel(option)}
										</ContextMenuItem>
									))}
									<ContextMenuSeparator />
									<ContextMenuItem
										icon={CONVERT_ICONS.task}
										disabled={currentOption === "task"}
										onClick={() => selectOption("task")}
									>
										{optionLabel("task")}
									</ContextMenuItem>
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
						</>
					)}
				</ContextMenuContent>
			</ContextMenu>
			{bulkSelection && (
				<BulkDeleteDialog
					count={bulkSelection.count}
					open={deleteConfirmOpen}
					onOpenChange={setDeleteConfirmOpen}
					onConfirm={bulkSelection.onDelete}
				/>
			)}
		</>
	);
}
