export const NODE_ROW_ATTRIBUTE = "data-node-id";
export const FLIP_ID_ATTRIBUTE = "data-flip-id";

export function nodeRowDomAttributes(nodeId: string) {
	return { [NODE_ROW_ATTRIBUTE]: nodeId, [FLIP_ID_ATTRIBUTE]: nodeId };
}

/** For clones (drag previews) that must not be matched as real rows. */
export function stripNodeRowAttributes(el: HTMLElement) {
	el.removeAttribute(NODE_ROW_ATTRIBUTE);
	el.removeAttribute(FLIP_ID_ATTRIBUTE);
}

export function findNodeRow(
	container: HTMLElement,
	nodeId: string,
): HTMLElement | null {
	return container.querySelector<HTMLElement>(
		`[${NODE_ROW_ATTRIBUTE}="${CSS.escape(nodeId)}"]`,
	);
}
