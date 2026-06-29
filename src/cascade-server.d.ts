// Type declaration for ?cascade-server virtual module suffix.
// In client builds the Vite plugin resolves these to an empty module.
// In SSR builds they resolve to the real module.
// Type safety at use sites is enforced by CascadeFeature.schema / .procedures fields.
declare module "*?cascade-server" {
	const exports: Record<string, unknown>;
	export = exports;
}
