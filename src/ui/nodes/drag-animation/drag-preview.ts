import { gsap } from "gsap";
import { dragAnimationConfig } from "@/ui/nodes/drag-animation/config";
import {
	findNodeRow,
	stripNodeRowAttributes,
} from "@/ui/nodes/drag-animation/node-rows";

export interface Point {
	x: number;
	y: number;
}

export interface DragPreviewHandle {
	follow(point: Point): void;
	settleInto(rect: Pick<DOMRect, "left" | "top">): void;
	cancel(): void;
}

/**
 * Cursor-following clone of a row plus, if it's being dragged with
 * descendants, a stack of their rows underneath (capped at
 * `maxVisibleRows`, fading out via a mask so the cut-off isn't abrupt).
 * Rows beyond the cap are never queried or cloned.
 */
export function createDragPreview(
	sourceRow: HTMLElement,
	grabPoint: Point,
	descendantIds: string[] = [],
): DragPreviewHandle {
	const { preview, settle, cancel, sourceDimOpacity } = dragAnimationConfig;

	const rect = sourceRow.getBoundingClientRect();
	const grabX = grabPoint.x - rect.left;
	const grabY = grabPoint.y - rect.top;

	const wrapper = document.createElement("div");
	Object.assign(wrapper.style, {
		position: "fixed",
		top: "0",
		left: "0",
		width: `${rect.width}px`,
		pointerEvents: "none",
		zIndex: String(preview.zIndex),
		background: preview.background,
		borderRadius: preview.borderRadius,
		boxShadow: preview.boxShadow,
		overflow: "hidden",
	});

	const el = sourceRow.cloneNode(true) as HTMLElement;
	stripNodeRowAttributes(el);
	el.style.margin = "0";
	wrapper.appendChild(el);

	const shownIds = descendantIds.slice(0, preview.maxVisibleRows - 1);
	for (const id of shownIds) {
		const row = findNodeRow(document.body, id);
		if (!row) continue;
		const clone = row.cloneNode(true) as HTMLElement;
		stripNodeRowAttributes(clone);
		clone.style.margin = "0";
		wrapper.appendChild(clone);
	}
	if (shownIds.length > 0) {
		Object.assign(wrapper.style, {
			maskImage: preview.overflowMask,
			WebkitMaskImage: preview.overflowMask,
		});
	}

	document.body.appendChild(wrapper);
	sourceRow.style.opacity = String(sourceDimOpacity);

	gsap.set(wrapper, {
		x: rect.left,
		y: rect.top,
		transformOrigin: `${grabX}px ${grabY}px`,
	});
	gsap.to(wrapper, {
		opacity: preview.opacity,
		scale: preview.scale,
		rotate: preview.rotationDeg,
		duration: preview.intro.duration,
		ease: preview.intro.ease,
	});

	const toX = gsap.quickTo(wrapper, "x", preview.follow);
	const toY = gsap.quickTo(wrapper, "y", preview.follow);

	let finished = false;
	const finish = (): boolean => {
		if (finished) return false;
		finished = true;
		sourceRow.style.opacity = "";
		gsap.killTweensOf(wrapper);
		return true;
	};

	return {
		follow({ x, y }) {
			if (finished) return;
			toX(x - grabX);
			toY(y - grabY);
		},

		settleInto(target) {
			if (!finish()) return;
			gsap
				.timeline({ onComplete: () => wrapper.remove() })
				.to(wrapper, {
					x: target.left,
					y: target.top,
					rotate: 0,
					scaleX: settle.flight.scaleX,
					scaleY: settle.flight.scaleY,
					transformOrigin: "50% 0%",
					boxShadow: "0 0 0 rgba(0,0,0,0)",
					duration: settle.flight.duration,
					ease: settle.flight.ease,
				})
				.to(wrapper, {
					scaleX: 1,
					scaleY: 1,
					duration: settle.spring.duration,
					ease: settle.spring.ease,
				})
				.to(
					wrapper,
					{
						opacity: 0,
						duration: settle.fade.duration,
						ease: settle.fade.ease,
					},
					`-=${settle.fade.overlapSeconds}`,
				);
		},

		cancel() {
			if (!finish()) return;
			gsap.to(wrapper, {
				opacity: 0,
				scale: cancel.scale,
				duration: cancel.duration,
				ease: cancel.ease,
				onComplete: () => wrapper.remove(),
			});
		},
	};
}
