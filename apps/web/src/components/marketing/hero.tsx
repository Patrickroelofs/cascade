import { Button } from "@cascade/ui/button";
import { VirtualTree } from "@cascade/ui/tree/virtual-tree";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useDemoTree } from "#/lib/use-demo-tree";

export function Hero() {
	const tree = useDemoTree();
	return (
		<header className="mx-auto max-w-4xl px-8 pt-24 pb-18 text-center">
			<h1 className="mb-6 text-balance font-serif text-5xl md:text-[68px] leading-[1.05] font-light tracking-[-0.02em]">
				A quieter place to think in lists.
			</h1>
			<p className="mx-auto mb-12 max-w-lg text-pretty text-lg text-graphite">
				Cascade is an infinitely nested outliner.
				<br />
				One outline for all your notes.
			</p>
			<div className="flex flex-col items-center gap-3.5">
				<Button
					nativeButton={false}
					// biome-ignore lint/a11y/useAnchorContent: content is supplied as Button's children and composed onto the anchor by Base UI's render prop
					render={<a href="/register" />}
					icon={<ArrowRightIcon className="size-4" weight="bold" />}
				>
					Try Cascade; it&rsquo;s free
				</Button>
				<p className="text-sm text-graphite">
					Or try the outline below — it&rsquo;s live, nothing is saved.
				</p>
			</div>
			<VirtualTree
				tree={tree}
				indentSize={16}
				className="mt-10 h-[420px] overflow-auto rounded-2xl border border-dark-grey/10 bg-white text-left shadow-lg shadow-dark-grey/10"
				contentClassName="max-w-none mx-0 px-6 py-6"
			/>
		</header>
	);
}
