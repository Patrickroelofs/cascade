import { createContext, type ReactNode, use } from "react";
import { defaultOutlinerLabels } from "./default-outliner-labels";
import type { OutlinerLabels } from "./outliner-labels.types";

export { defaultOutlinerLabels } from "./default-outliner-labels";
export type { OutlinerLabels } from "./outliner-labels.types";

const OutlinerLabelsContext = createContext<OutlinerLabels | null>(null);

export function OutlinerLabelsProvider({
	labels,
	children,
}: {
	labels: OutlinerLabels;
	children: ReactNode;
}) {
	return (
		<OutlinerLabelsContext value={labels}>{children}</OutlinerLabelsContext>
	);
}

export function useOutlinerLabels(): OutlinerLabels {
	return use(OutlinerLabelsContext) ?? defaultOutlinerLabels;
}
