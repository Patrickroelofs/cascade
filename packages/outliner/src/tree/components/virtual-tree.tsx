import { Outliner } from "../../index";
import type { VirtualTreeProps } from "../model/virtual-tree.types";

export type { VirtualTreeProps } from "../model/virtual-tree.types";

/** @deprecated Prefer the package-root `Outliner` component. */
export function VirtualTree(props: VirtualTreeProps) {
	return <Outliner {...props} />;
}
