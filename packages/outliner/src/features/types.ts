import type { ReactNode } from "react";
import type { TagSummary } from "../node-tags";
import type { VisibleNodeRow } from "../node-types";

/**
 * Per-row data and callbacks a built-in feature's slot renderers need. Kept
 * as one shared shape rather than typed per feature, since this composes a
 * small, known set of built-in features rather than a public plugin API.
 */
export interface RowFeatureContext {
	row: VisibleNodeRow;
	dueDate: Date | null;
	completed: boolean;
	existingTags: TagSummary[];
	onSetDueDate: (date: Date | null) => void;
	onSetTags: (tags: string[]) => void;
	onDeleteTag?: (name: string) => void | Promise<void>;
	onToggleTask: (completed: boolean) => void;
}

/**
 * A single outliner row/context-menu feature. `VirtualTree`'s `features`
 * prop takes a list of these instead of the tree row hardcoding each
 * feature's rendering inline.
 */
export interface OutlinerFeature {
	id: string;
	/** Rendered before the node editor (e.g. a task checkbox). */
	renderLeading?: (ctx: RowFeatureContext) => ReactNode;
	/** Rendered after the node editor, alongside other trailing slots (e.g. a due-date pill). */
	renderTrailing?: (ctx: RowFeatureContext) => ReactNode;
	/** Rendered as a submenu/item in the row's right-click menu, before the
	 * core "Convert into" / "Delete" entries. */
	renderContextMenuItem?: (ctx: RowFeatureContext) => ReactNode;
}
