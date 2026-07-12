import { Button } from "@cascade/ui/button";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { HeartIcon } from "@phosphor-icons/react/ssr";
import { m } from "#/paraglide/messages.js";

export function Footer() {
	return (
		<footer className="mx-auto max-w-3xl px-8 pt-6 pb-12 text-center">
			<h2 className="mb-16 font-serif text-4xl md:text-6xl font-light italic">
				{m.footer_tagline()}
			</h2>
			<div className="flex justify-center">
				<Button
					nativeButton={false}
					// biome-ignore lint/a11y/useAnchorContent: content is supplied as Button's children and composed onto the anchor by Base UI's render prop
					render={<a href="/register" />}
					icon={<ArrowRightIcon className="size-4" weight="bold" />}
				>
					{m.footer_cta()}
				</Button>
			</div>
			<div className="mt-18 flex flex-col-reverse items-center gap-4 border-t border-dark-grey/8 pt-6 text-base md:flex-row md:justify-between">
				<span className="font-serif text-base italic">cascade</span>
				<div className="inline-flex items-center gap-4">
					<a href="/privacy" className="hover:underline focus:underline">
						{m.footer_privacy()}
					</a>
					<a href="/terms" className="hover:underline focus:underline">
						{m.footer_terms()}
					</a>
					<div className="inline-flex items-center gap-0.75">
						<span>{m.footer_with()}</span>
						<HeartIcon className="fill-redleather" weight="fill" />
						<span>{m.footer_from()}</span>
						<a
							href="https://patrickroelofs.com"
							className="hover:underline focus:underline"
						>
							Patrick Roelofs
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
