import { createContext, useContext } from "react";
import type { CascadeUISlots } from "./feature";

const SlotsCtx = createContext<CascadeUISlots[]>([]);
export const SlotsProvider = SlotsCtx.Provider;

export function useSlot<K extends keyof CascadeUISlots>(
	key: K,
): NonNullable<CascadeUISlots[K]> {
	return useContext(SlotsCtx).flatMap(
		(s) => s[key] ?? [],
	) as NonNullable<CascadeUISlots[K]>;
}
