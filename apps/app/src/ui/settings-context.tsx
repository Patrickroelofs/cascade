import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, use, useEffect, useState } from "react";
import type {
	Settings,
	SettingsPatch,
} from "@/core/settings/settings-patch-schema";
import { orpc } from "@/orpc/client";

export {
	MAX_INDENT_SIZE,
	MIN_INDENT_SIZE,
} from "@/core/settings/settings-patch-schema";

function defaults(): Settings {
	return {
		dark:
			typeof matchMedia !== "undefined" &&
			matchMedia("(prefers-color-scheme: dark)").matches,
		indentSize: 16,
		lastSeenChangelogId: null,
		preAlphaBannerDismissed: false,
	};
}

const SettingsContext = createContext<{
	settings: Settings;
	setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
	saveSettings: () => void;
} | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
	// Changes made since the last successful save; flushed by `saveSettings`
	// (called when the settings dialog closes).
	const [unsaved, setUnsaved] = useState<SettingsPatch>({});
	const queryClient = useQueryClient();

	const queryOptions = orpc.settings.get.queryOptions();
	// Already in the cache on first render: the root route's loader ensures it
	// during SSR. Refetched on window focus (the query default), so changes
	// made on another device are picked up when returning to the tab.
	const { data: remote } = useQuery(queryOptions);

	const { mutate } = useMutation(
		orpc.settings.update.mutationOptions({
			onSuccess: (merged, patch) => {
				// The server returns the merged row (which may include keys written
				// by other devices); make it the new baseline and drop the unsaved
				// keys it covers. A key re-changed while the save was in flight
				// keeps its newer value and goes out with the next save.
				queryClient.setQueryData(queryOptions.queryKey, merged);
				setUnsaved(
					(prev) =>
						Object.fromEntries(
							Object.entries(prev).filter(
								([key, value]) => patch[key as keyof SettingsPatch] !== value,
							),
						) as SettingsPatch,
				);
			},
			// On error the patch simply stays in `unsaved`: the change keeps
			// applying locally and the next save retries it.
		}),
	);

	// Derived, never synced: server state with unsaved edits on top. A focus
	// refetch can update `remote` mid-edit without clobbering what the user is
	// doing.
	const settings: Settings = { ...defaults(), ...remote, ...unsaved };

	// The `dark` class lives on <html>, outside this component's tree. SSR
	// renders the initial value (see __root.tsx); this keeps it in sync with
	// changes made after hydration.
	useEffect(() => {
		document.documentElement.classList.toggle("dark", settings.dark);
	}, [settings.dark]);

	function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
		setUnsaved((prev) => ({ ...prev, [key]: value }));
	}

	function saveSettings() {
		if (Object.keys(unsaved).length === 0) return;
		mutate(unsaved);
	}

	return (
		<SettingsContext value={{ settings, setSetting, saveSettings }}>
			{children}
		</SettingsContext>
	);
}

export function useSettings() {
	const ctx = use(SettingsContext);
	if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
	return ctx;
}
