import { XIcon } from "@phosphor-icons/react/ssr";
import { Link } from "@tanstack/react-router";
import type { TagSummary } from "@/core/tags/tag.types";

interface TagChipProps {
	tag: TagSummary;
	onRemove?: () => void;
}

/** Small colored pill for a tag; the name links to that tag's filtered node list. */
export function TagChip({ tag, onRemove }: TagChipProps) {
	return (
		<span
			className="inline-flex items-center gap-1 rounded-full pl-2 pr-0.5 py-0.5 text-xs font-medium text-white overflow-hidden"
			style={{ backgroundColor: tag.color }}
		>
			<Link
				to="/tag/$tagId"
				params={{ tagId: tag.id }}
				viewTransition
				onClick={(e) => e.stopPropagation()}
				className="outline-none hover:underline focus-visible:ring-2 focus-visible:ring-white/70 rounded-sm"
			>
				{tag.name}
			</Link>
			{onRemove && (
				<button
					type="button"
					aria-label={`Remove tag ${tag.name}`}
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
					className="flex cursor-pointer items-center justify-center rounded-full outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-white/70 p-0.5"
				>
					<XIcon size={10} weight="bold" />
				</button>
			)}
		</span>
	);
}
