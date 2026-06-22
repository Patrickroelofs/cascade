import { Toggle } from "@base-ui-components/react/toggle";
import { ToggleGroup } from "@base-ui-components/react/toggle-group";
import { Monitor, Moon, Sun } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "auto";

function getInitialMode(): ThemeMode {
	if (typeof window === "undefined") return "auto";
	const stored = window.localStorage.getItem("theme");
	return stored === "light" || stored === "dark" || stored === "auto"
		? stored
		: "auto";
}

function applyThemeMode(mode: ThemeMode) {
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const resolved = mode === "auto" ? (prefersDark ? "dark" : "light") : mode;
	document.documentElement.classList.remove("light", "dark");
	document.documentElement.classList.add(resolved);
	if (mode === "auto") {
		document.documentElement.removeAttribute("data-theme");
	} else {
		document.documentElement.setAttribute("data-theme", mode);
	}
	document.documentElement.style.colorScheme = resolved;
}

const MODES = [
	{ value: "light", icon: Sun, label: "Light" },
	{ value: "auto", icon: Monitor, label: "Auto" },
	{ value: "dark", icon: Moon, label: "Dark" },
] as const;

export default function ThemeToggle() {
	const [mode, setMode] = useState<ThemeMode>("auto");

	useEffect(() => {
		const initialMode = getInitialMode();
		setMode(initialMode);
		applyThemeMode(initialMode);
	}, []);

	useEffect(() => {
		if (mode !== "auto") return;
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyThemeMode("auto");
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, [mode]);

	function handleValueChange(value: string[]) {
		const next = (value[0] ?? "auto") as ThemeMode;
		setMode(next);
		applyThemeMode(next);
		window.localStorage.setItem("theme", next);
	}

	return (
		<ToggleGroup
			value={[mode]}
			onValueChange={handleValueChange}
			aria-label="Theme mode"
			className="flex items-center rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] p-1 shadow-[0_8px_22px_rgba(30,90,72,0.08)]"
		>
			{MODES.map(({ value, icon: Icon, label }) => (
				<Toggle
					key={value}
					value={value}
					aria-label={label}
					title={label}
					className="rounded-full p-1.5 text-[var(--sea-ink-soft)] transition data-[pressed]:bg-[var(--link-bg-hover)] data-[pressed]:text-[var(--sea-ink)]"
				>
					<Icon size={14} weight="bold" />
				</Toggle>
			))}
		</ToggleGroup>
	);
}
