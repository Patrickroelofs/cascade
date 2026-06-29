import type { AnyPgTable } from "drizzle-orm/pg-core";
import type React from "react";

export interface FeatureHooks {
	/** Called once at app startup, after all features are resolved */
	onInit?: (config: ResolvedCascadeConfig) => void | Promise<void>;
}

/**
 * Named layout slots that features can contribute React components into.
 * Add new slots here to make them available across the entire plugin system.
 */
export interface CascadeUISlots {
	topRightMenu?: React.ComponentType[];
	topLeftMenu?: React.ComponentType[];
	bottomLeftMenu?: React.ComponentType[];
	bottomRightMenu?: React.ComponentType[];
	afterNodeActions?: React.ComponentType<{
		nodeId: string;
		nodeParentId: string | null;
	}>[];
	nodeText?: React.ComponentType<{
		nodeId: string;
		text: string;
		parentId: string | null;
		withTransition?: boolean;
	}>[];
}

export interface CascadeFeature {
	/** Unique identifier for this feature */
	name: string;
	/** Human-readable description */
	description?: string;
	/** Lazy thunk returning Drizzle table definitions — use `() => import("./schema?cascade-server")` */
	schema?: () => Promise<Record<string, AnyPgTable>>;
	/** Lazy thunk returning ORPC procedures — use `() => import("./procedures?cascade-server")` */
	procedures?: () => Promise<Record<string, unknown>>;
	/** Feature names this feature depends on (validated at startup) */
	dependencies?: string[];
	/** Lifecycle hooks */
	hooks?: FeatureHooks;
	/** UI components contributed to named layout slots */
	slots?: CascadeUISlots;
	/** Resolved by bootstrap — do not set manually */
	_resolvedSchema?: Record<string, AnyPgTable>;
	/** Resolved by bootstrap — do not set manually */
	_resolvedProcedures?: Record<string, unknown>;
}

export interface ResolvedCascadeConfig {
	features: CascadeFeature[];
}

/** Type-safe helper — not required, but gives better inference than plain object literals */
export function defineFeature(feature: CascadeFeature): CascadeFeature {
	return feature;
}
