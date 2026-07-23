import { useSyncExternalStore } from "react";

// Module-level singleton (same pattern as @cascade/ui/toast's toastManager
// and @/ui/undo/undo-store): the Calendar entry's own year/month/day/day-node
// lists are plain one-off loads, not a shared query cache (see
// calendar-node.tsx), so nothing tells an already-expanded branch to refresh
// when a due date changes somewhere else — the real tree, another calendar
// row, undo/redo, all of it. Every site that adds, changes, or clears a due
// date (or deletes/restores a node) calls `notify()`; `useCalendarRefreshToken`
// subscribes and the result is passed down as `CalendarNode`'s `refreshToken`.
type Listener = () => void;

let listeners: Listener[] = [];
let version = 0;

function notify() {
	version++;
	for (const listener of listeners) listener();
}

function subscribe(listener: Listener): () => void {
	listeners = [...listeners, listener];
	return () => {
		listeners = listeners.filter((l) => l !== listener);
	};
}

function getVersion(): number {
	return version;
}

/** Test-only: resets the version/listener state so specs don't leak across cases. */
function reset() {
	listeners = [];
	version = 0;
}

export const calendarRefreshStore = { notify, subscribe, getVersion, reset };

/** Reactive version of `calendarRefreshStore.getVersion()`: re-renders the
 * calling component whenever any due-date-affecting mutation calls `notify`.
 * This app is server-rendered, so `getServerSnapshot` is required even
 * though the store is a client-only concern (mutations only ever run in the
 * browser) — the version is always 0 on the server. */
export function useCalendarRefreshToken(): number {
	return useSyncExternalStore(
		calendarRefreshStore.subscribe,
		calendarRefreshStore.getVersion,
		() => 0,
	);
}
