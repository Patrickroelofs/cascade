import { defaultScheduler, notifyManager } from "@tanstack/react-query";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { flushSync } from "react-dom";
import { dragAnimationConfig } from "@/ui/nodes/drag-animation/config";
import { FLIP_ID_ATTRIBUTE } from "@/ui/nodes/drag-animation/node-rows";

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
						{ opacity: 1, y: 0, duration: enter.duration, ease: enter.ease },
					)
			: undefined,
	});
}

function rowElements(
	container: HTMLElement,
	ignoredId?: string,
): HTMLElement[] {
	const selector = ignoredId
		? `[${FLIP_ID_ATTRIBUTE}]:not([${FLIP_ID_ATTRIBUTE}="${CSS.escape(ignoredId)}"])`
		: `[${FLIP_ID_ATTRIBUTE}]`;
	return Array.from(container.querySelectorAll<HTMLElement>(selector));
}
