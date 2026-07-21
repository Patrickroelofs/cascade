import type { ReactNode } from "react";

export interface OutlinerFeature<TContext = unknown> {
	id: string;
	/** Rendered before the node editor (e.g. a task checkbox). */
	renderLeading?(ctx: TContext): ReactNode;
	/** Rendered after the node editor, alongside other trailing slots (e.g. a due-date pill). */
	renderTrailing?(ctx: TContext): ReactNode;
	/** Rendered as a submenu/item in the row's right-click menu, before the
	 * core "Convert into" / "Delete" entries. */
	renderContextMenuItem?(ctx: TContext): ReactNode;
}
