import { defaultScheduler, notifyManager } from "@tanstack/react-query";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { flushSync } from "react-dom";
import { dragAnimationConfig } from "../drag-animation/config";
import { FLIP_ID_ATTRIBUTE, findNodeRow } from "../drag-animation/node-rows";

gsap.registerPlugin(Flip);

function commitSync(mutate: () => void): void {
	notifyManager.setScheduler((cb) => cb());
	try {
		flushSync(() => notifyManager.batch(mutate));
	} finally {
		notifyManager.setScheduler(defaultScheduler);
	}
}

export function animateTreeChange(
	container: HTMLElement,
	mutate: () => void,
	options: { ignoredId?: string; animateEnter?: boolean } = {},
): void {
	const { displacement, enter } = dragAnimationConfig;
	const state = Flip.getState(rowElements(container, options.ignoredId), {
		simple: true,
	});
	commitSync(mutate);
	Flip.from(state, {
		targets: rowElements(container, options.ignoredId),
		duration: displacement.duration,
		ease: displacement.ease,
		onEnter: options.animateEnter
			? (elements) =>
					gsap.fromTo(
						elements,
						{ opacity: 0, y: enter.offsetY },
						{
							opacity: 1,
							y: 0,
							duration: enter.duration,
							ease: enter.ease,
							stagger: enter.stagger,
						},
					)
			: undefined,
	});
}

/** Fades a row out, then closes the gap it leaves behind. */
export function animateNodeRemoval(
	container: HTMLElement,
	nodeId: string,
	mutate: () => void,
): void {
	const row = findNodeRow(container, nodeId);
	if (!row) {
		commitSync(mutate);
		return;
	}
	const { leave } = dragAnimationConfig;
	gsap.to(row, {
		opacity: 0,
		scale: leave.scale,
		duration: leave.duration,
		ease: leave.ease,
		onComplete: () =>
			animateTreeChange(container, mutate, { ignoredId: nodeId }),
	});
}

/**
 * Fades rows newly excluded by a filter out in place (without disturbing
 * layout), then applies the mutation and lets the resulting FLIP pass close
 * the gaps and fade newly-included rows in — the same "leave, then reflow"
 * shape as `animateNodeRemoval`, generalized to many rows leaving at once.
 */
export function animateFilterChange(
	container: HTMLElement,
	mutate: () => void,
	leavingIds: Iterable<string>,
): void {
	const leavingElements = Array.from(leavingIds)
		.map((id) => findNodeRow(container, id))
		.filter((el): el is HTMLElement => el !== null);

	if (leavingElements.length === 0) {
		animateTreeChange(container, mutate, { animateEnter: true });
		return;
	}

	const { leave } = dragAnimationConfig;
	gsap.to(leavingElements, {
		opacity: 0,
		scale: leave.scale,
		duration: leave.duration,
		ease: leave.ease,
		onComplete: () => {
			// The row's DOM node is reused if the filter later un-hides it, so
			// clear these inline styles rather than leaving it stuck faded out.
			gsap.set(leavingElements, { clearProps: "opacity,scale" });
			animateTreeChange(container, mutate, { animateEnter: true });
		},
	});
}

function rowElements(
	container: HTMLElement,
	ignoredId?: string,
): HTMLElement[] {
	const selector = ignoredId
		? `[${FLIP_ID_ATTRIBUTE}]:not([${FLIP_ID_ATTRIBUTE}="${CSS.escape(ignoredId)}"])`
		: `[${FLIP_ID_ATTRIBUTE}]`;
	return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
		(el) => !el.closest(".hidden"),
	);
}
