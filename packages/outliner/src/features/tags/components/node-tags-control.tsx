import { Popover, PopoverContent, PopoverTrigger } from "@cascade/ui/popover";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { useOutlinerLabels } from "../../../i18n/outliner-labels-context";
import type { TagSummary } from "../../../nodes/model/node-tags";
import { NodeTagsEditor } from "./node-tags-editor/node-tags-editor";
import { addTagTrigger, MAX_VISIBLE_TAGS, tagPill } from "./tag-pill.styles";
import { TagPillRow } from "./tag-pill-row";

interface NodeTagsControlProps {
	tags: string[];
	existingTags: TagSummary[];
	onChange: (tags: string[]) => void;
	onDeleteTag?: (name: string) => void | Promise<void>;
}

export function NodeTagsControl({
	tags,
	existingTags,
	onChange,
	onDeleteTag,
}: NodeTagsControlProps) {
	const labels = useOutlinerLabels();
	const hiddenCount = tags.length - MAX_VISIBLE_TAGS;

	return (
		<Popover>
			<TagPillRow tags={tags}>
				<PopoverTrigger
					className={
						hiddenCount > 0
							? tagPill({ interactive: true, className: "tabular-nums" })
							: addTagTrigger()
					}
					aria-label={tags.length > 0 ? labels.manageTags : labels.addTag}
					onClick={(event) => event.stopPropagation()}
				>
					{hiddenCount > 0 ? (
						`+${hiddenCount}`
					) : (
						<PlusIcon size={10} weight="bold" />
					)}
				</PopoverTrigger>
			</TagPillRow>
			<PopoverContent>
				<NodeTagsEditor
					tags={tags}
					existingTags={existingTags}
					onChange={onChange}
					onDeleteTag={onDeleteTag}
				/>
			</PopoverContent>
		</Popover>
	);
}
