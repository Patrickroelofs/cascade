import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, use, useEffect, useRef, useState } from "react";
import {
	type Settings,
	type SettingsPatch,
	settingsPatchSchema,
} from "@/core/settings/settings-patch-schema";
import { client, orpc } from "@/orpc/client";

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

/** localStorage keeps a copy of the stored patch so settings apply instantly
 * on boot (before the server round-trip) and the dark-mode script in
 * `__root.tsx` can read it pre-hydration. */
function readLocal(): SettingsPatch {
	if (typeof localStorage === "undefined") return {};
	try {
		const parsed = settingsPatchSchema.safeParse(
			JSON.parse(localStorage.settings ?? "{}"),
		);
		return parsed.success ? parsed.data : {};
	} catch {
		return {};
	}
}

function writeLocal(stored: SettingsPatch) {
	localStorage.settings = JSON.stringify(stored);
}

const SettingsContext = createContext<{
	settings: Settings;
	setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
} | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
	const [stored, setStored] = useState<SettingsPatch>(readLocal);
	const pendingWrites = useRef(0);
	const seededServer = useRef(false);
	const queryClient = useQueryClient();

	// Fetched on load and refetched on window focus (the query default), so
	// changes made on another device are picked up when returning to the tab.
	const { data: remote } = useQuery(orpc.settings.get.queryOptions());

	useEffect(() => {
		if (remote === undefined) return;
		// Don't clobber an optimistic local change with a stale server response.
		if (pendingWrites.current > 0) return;
		if (Object.keys(remote).length === 0) {
			// Nothing stored server-side yet: seed it from this device's
			// pre-existing local settings instead of wiping them.
			const local = readLocal();
			if (!seededServer.current && Object.keys(local).length > 0) {
				seededServer.current = true;
				client.settings.update(local).catch(() => {});
			}
			return;
		}
		setStored(remote);
		writeLocal(remote);
	}, [remote]);

	const settings: Settings = { ...defaults(), ...stored };

	useEffect(() => {
		document.documentElement.classList.toggle("dark", settings.dark);
	}, [settings.dark]);

	function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
		const next = { ...stored, [key]: value };
		setStored(next);
		writeLocal(next);
		// Keep the query cache in step with the optimistic write; otherwise a
		// focus refetch whose result deep-equals the stale cache keeps the same
		// object reference (structural sharing) and the apply effect never runs.
		queryClient.setQueryData(orpc.settings.get.queryOptions().queryKey, next);
		pendingWrites.current += 1;
		client.settings
			.update({ [key]: value })
			.catch(() => {
				// Offline or transient failure: the change still applies locally
				// and will be re-sent the next time this setting changes.
			})
			.finally(() => {
				pendingWrites.current -= 1;
			});
	}

	return (
		<SettingsContext value={{ settings, setSetting }}>
			{children}
		</SettingsContext>
	);
}

export function useSettings() {
	const ctx = use(SettingsContext);
	if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
	return ctx;
}
