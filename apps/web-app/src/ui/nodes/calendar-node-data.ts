import { formatCalendarDate } from "@cascade/outliner/calendar-date";
import type { CalendarNodeProps } from "@cascade/outliner/calendar-node";
import type { TypedMetadata } from "@cascade/outliner/node-types";
import { toast } from "@cascade/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { m } from "#/paraglide/messages.js";
import { client, orpc } from "@/orpc/client";
import { calendarRefreshStore } from "@/ui/nodes/calendar-refresh-store";
import { existingTagsOptions } from "@/ui/nodes/use-existing-tags";
import { undoStore } from "@/ui/undo/undo-store";

/** The Calendar entry's data loaders and node mutations, wired to the real
 * `calendar.*`/`nodes.*` oRPC procedures. Unlike the main tree's mutations
 * (see `virtual-tree/data/mutations`), these don't patch a shared
 * `visibleTree` query cache: a due node can live anywhere in the outline,
 * not just wherever is currently loaded, so each edit just persists and
 * broadly invalidates instead of doing a precise optimistic patch. Content/
 * type/tags/due-date changes still get undo/redo, using the pre-mutation
 * value `CalendarNode` already has in hand (it renders the row). Duplicate
 * and delete don't — `useDuplicateMutation`/`useRemoveMutation` support it
 * for the real tree by reading a full subtree snapshot out of that tree's
 * cache first, which isn't available here.
 *
 * Due-date changes, deletes, and duplicates also call
 * `calendarRefreshStore.notify()` so any other already-expanded calendar
 * branch (and the real tree's own due-date changes call it too) picks up
 * the change — see that module.
 */
export function useCalendarNodeData(): Omit<
	CalendarNodeProps,
	| "renderNodeLink"
	| "indentSize"
	| "existingTags"
	| "onDeleteTag"
	| "onTagClick"
> {
	const queryClient = useQueryClient();

	function invalidateTree() {
		return queryClient.invalidateQueries({
			queryKey: orpc.nodes.visibleTree.key(),
		});
	}

	const rawSaveContent = (id: string, content: { root: unknown } | null) =>
		client.nodes.updateContent({ id, content }).then(invalidateTree);

	const rawSetType = (id: string, typed: TypedMetadata) =>
		client.nodes.setType({ id, ...typed }).then(invalidateTree);

	// The calendar's own year/month/day/day-node lists are plain one-off
	// loads (see calendar-node.tsx), not a TanStack Query cache; CalendarNode
	// already drops the node from its current day's list optimistically, and
	// `calendarRefreshStore.notify()` (see that module) tells every other
	// currently-expanded branch — this due node might now belong to a
	// different, already-open day/month/year, or change a count badge. Fired
	// after the write actually lands, not alongside it, so a refetch doesn't
	// race ahead and read stale state.
	const rawSetDueDate = (id: string, dueDate: string | null) =>
		client.nodes.setDueDate({ id, dueDate }).then(() => {
			invalidateTree();
			calendarRefreshStore.notify();
		});

	const rawSetTags = (id: string, tags: string[]) =>
		client.nodes.setTags({ id, tags }).then(() => {
			invalidateTree();
			queryClient.invalidateQueries({
				queryKey: existingTagsOptions().queryKey,
			});
		});

	return {
		loadYears: () => client.calendar.years(),
		loadMonths: (year: number) => client.calendar.months({ year }),
		loadDays: (year: number, month: number) =>
			client.calendar.days({ year, month }),
		loadDayNodes: (date) => client.calendar.dayNodes({ date }),

		onSaveContent: (id, content, previousContent) => {
			rawSaveContent(id, content);
			undoStore.push({
				undo: () => rawSaveContent(id, previousContent),
				redo: () => rawSaveContent(id, content),
			});
		},
		onSetType: (id, typed, previous) => {
			rawSetType(id, typed);
			undoStore.push({
				undo: () => rawSetType(id, previous),
				redo: () => rawSetType(id, typed),
			});
		},
		onSetDueDate: (id, date, previousDate) => {
			const nextDate = date ? formatCalendarDate(date) : null;
			rawSetDueDate(id, nextDate);
			undoStore.push({
				undo: () => rawSetDueDate(id, previousDate),
				redo: () => rawSetDueDate(id, nextDate),
			});
		},
		onSetTags: (id, tags, previousTags) => {
			rawSetTags(id, tags);
			undoStore.push({
				undo: () => rawSetTags(id, previousTags),
				redo: () => rawSetTags(id, tags),
			});
		},
		onDuplicate: (id) => {
			const run = client.nodes.duplicate({ id }).then(invalidateTree);
			toast
				.promise(run, {
					loading: m.node_duplicating(),
					success: m.node_duplicated(),
					error: m.node_duplicate_failed(),
				})
				.then(() => calendarRefreshStore.notify())
				.catch(() => {
					// Already surfaced by the error toast above.
				});
		},
		onDelete: (id) => {
			client.nodes.delete({ id }).then(() => {
				invalidateTree();
				calendarRefreshStore.notify();
			});
		},
	};
}
