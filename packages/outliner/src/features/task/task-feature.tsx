import type { VisibleNodeRow } from "../../nodes/model/node-types";
import type { OutlinerFeature } from "../model/outliner-feature.types";
import { NodeCheckbox } from "./components/node-checkbox";

export interface TaskFeatureContext {
	row: Pick<VisibleNodeRow, "type" | "metadata">;
	onToggleTask: (completed: boolean) => void;
}

/**
 * Task type: renders the completion checkbox on task-type rows. Doesn't
 * contribute a context-menu item — converting into/out of "task" happens via
 * the core "Convert into" submenu, driven by the node-type registry itself
 * rather than by individual features.
 */
export const taskFeature: OutlinerFeature<TaskFeatureContext> = {
	id: "task",
	renderLeading: (ctx) =>
		ctx.row.type === "task" ? (
			<NodeCheckbox metadata={ctx.row.metadata} onToggle={ctx.onToggleTask} />
		) : null,
};
