import { isDueThisWeek, startOfWeek } from "@cascade/outliner/due-date-bucket";
import { getRowVisibility } from "@cascade/outliner/filter-visibility";
import { noFilters } from "@cascade/outliner/node-filters";
import type { VisibleNodeRow } from "@cascade/outliner/node-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Wednesday; the surrounding week runs Monday July 13 through Sunday July 19.
const wednesday = new Date(2026, 6, 15, 12, 0, 0);

function row(
	id: string,
	parentId: string | null,
	depth: number,
	dueDate: Date | null,
	metadata: VisibleNodeRow["metadata"] = { completed: false },
): VisibleNodeRow {
	return {
		id,
		parentId,
		content: null,
		type: "task",
		metadata,
		expanded: true,
		order: id,
		dueDate,
		tags: [],
		depth,
		path: [id],
		hasChildren: false,
		isLastChild: false,
	};
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(wednesday);
});

afterEach(() => {
	vi.useRealTimers();
});

describe("startOfWeek", () => {
	it("returns the Monday of the containing week", () => {
		expect(startOfWeek(wednesday)).toEqual(new Date(2026, 6, 13));
	});

	it("keeps a Monday on itself and pulls a Sunday back six days", () => {
		expect(startOfWeek(new Date(2026, 6, 13, 8))).toEqual(
			new Date(2026, 6, 13),
		);
		expect(startOfWeek(new Date(2026, 6, 19, 23))).toEqual(
			new Date(2026, 6, 13),
		);
	});
});

describe("isDueThisWeek", () => {
	it("matches dates from Monday through Sunday of the current week", () => {
		expect(isDueThisWeek(new Date(2026, 6, 13), false)).toBe(true);
		expect(isDueThisWeek(new Date(2026, 6, 15), false)).toBe(true);
		expect(isDueThisWeek(new Date(2026, 6, 19, 23, 59), false)).toBe(true);
	});

	it("rejects dates outside the current week", () => {
		expect(isDueThisWeek(new Date(2026, 6, 12), false)).toBe(false);
		expect(isDueThisWeek(new Date(2026, 6, 20), false)).toBe(false);
	});

	it("rejects completed tasks", () => {
		expect(isDueThisWeek(new Date(2026, 6, 15), true)).toBe(false);
	});
});

describe("getRowVisibility with dueThisWeek", () => {
	const friday = new Date(2026, 6, 17);
	const nextMonday = new Date(2026, 6, 20);

	it("hides everything when no filter is active", () => {
		const rows = [row("a", null, 0, friday), row("b", null, 0, null)];
		const visibility = getRowVisibility(rows, noFilters);
		expect(visibility.hiddenIds.size).toBe(0);
		expect(visibility.contextIds.size).toBe(0);
	});

	it("keeps rows due this week and hides the rest", () => {
		const rows = [
			row("due-friday", null, 0, friday),
			row("due-next-week", null, 0, nextMonday),
			row("no-due-date", null, 0, null),
		];
		const visibility = getRowVisibility(rows, {
			...noFilters,
			dueThisWeek: true,
		});
		expect(visibility.hiddenIds).toEqual(
			new Set(["due-next-week", "no-due-date"]),
		);
	});

	it("keeps ancestors of a match visible as context", () => {
		const rows = [
			row("parent", null, 0, null),
			row("child", "parent", 1, friday),
			row("other", null, 0, null),
		];
		const visibility = getRowVisibility(rows, {
			...noFilters,
			dueThisWeek: true,
		});
		expect(visibility.contextIds).toEqual(new Set(["parent"]));
		expect(visibility.hiddenIds).toEqual(new Set(["other"]));
	});

	it("hides completed tasks due this week", () => {
		const rows = [
			row("open", null, 0, friday),
			row("done", null, 0, friday, { completed: true }),
		];
		const visibility = getRowVisibility(rows, {
			...noFilters,
			dueThisWeek: true,
		});
		expect(visibility.hiddenIds).toEqual(new Set(["done"]));
	});

	// The UI keeps due-date filters mutually exclusive; if both are ever
	// active anyway, rows must satisfy every active filter.
	it("requires rows to match all active filters when both are set", () => {
		const rows = [
			row("due-wednesday", null, 0, new Date(2026, 6, 15)),
			row("due-friday", null, 0, friday),
		];
		const visibility = getRowVisibility(rows, {
			dueToday: true,
			dueThisWeek: true,
		});
		expect(visibility.hiddenIds).toEqual(new Set(["due-friday"]));
	});
});
