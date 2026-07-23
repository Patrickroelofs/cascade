import type { OutlinerFeature } from "../model/outliner-feature.types";
import { DueDateMenuItem } from "./components/due-date-menu-item";
import { NodeDueDatePill } from "./components/node-due-date-pill";

export interface DueDateFeatureContext {
	dueDate: Date | null;
	completed: boolean;
	onSetDueDate: (date: Date | null) => void;
}

/** Due dates: a trailing pill on rows that have one, plus a "Set/Change
 * date" context-menu submenu. */
export const dueDateFeature: OutlinerFeature<DueDateFeatureContext> = {
	id: "due-date",
	renderTrailing: (ctx) =>
		ctx.dueDate ? (
			<NodeDueDatePill
				dueDate={ctx.dueDate}
				completed={ctx.completed}
				onChange={ctx.onSetDueDate}
			/>
		) : null,
	renderContextMenuItem: (ctx) => <DueDateMenuItem ctx={ctx} />,
};
