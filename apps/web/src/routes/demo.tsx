import { VirtualTree } from "@cascade/ui/tree/virtual-tree";
import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "#/components/marketing/nav";
import { seoHead } from "#/lib/seo";
import { useDemoTree } from "#/lib/use-demo-tree";

export const Route = createFileRoute("/demo")({
	head: () =>
		seoHead(
			"Try the demo - Cascade",
			"Try Cascade's infinitely nested outliner right in your browser. Nothing you type here is saved.",
			"/demo",
		),
	component: Demo,
});

function Demo() {
	const tree = useDemoTree();
	return (
		<>
			<Nav />
			<VirtualTree tree={tree} indentSize={16} />
		</>
	);
}
