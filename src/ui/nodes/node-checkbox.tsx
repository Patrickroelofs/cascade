import type { NodeMetadataOf } from "@/core/nodes/node-types";

interface NodeCheckboxProps {
	metadata: unknown;
	onToggle: (completed: boolean) => void;
}

/** Completion checkbox for task-type nodes. */
export function NodeCheckbox({ metadata, onToggle }: NodeCheckboxProps) {
	return (
		<input
			type="checkbox"
			aria-label="Task completed"
			checked={(metadata as NodeMetadataOf<"task"> | null)?.completed ?? false}
			onChange={(e) => onToggle(e.target.checked)}
			onClick={(e) => e.stopPropagation()}
			className="shrink-0 size-4 accent-redleather cursor-pointer"
		/>
	);
}
