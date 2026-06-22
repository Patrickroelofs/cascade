import { GithubLogo, XLogo } from "@phosphor-icons/react";

export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="mt-20 border-t border-[var(--line)] px-4 pb-14 pt-10 text-[var(--sea-ink-soft)]">
			<div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
				<p className="m-0 text-sm">
					&copy; {year} Your name here. All rights reserved.
				</p>
				<p className="island-kicker m-0">Built with TanStack Start</p>
			</div>
			<div className="mt-4 flex justify-center gap-4">
				<a
					href="https://x.com/tan_stack"
					target="_blank"
					rel="noreferrer"
					className="rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
				>
					<span className="sr-only">Follow TanStack on X</span>
					<XLogo size={32} aria-hidden />
				</a>
				<a
					href="https://github.com/TanStack"
					target="_blank"
					rel="noreferrer"
					className="rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
				>
					<span className="sr-only">Go to TanStack GitHub</span>
					<GithubLogo size={32} aria-hidden />
				</a>
			</div>
		</footer>
	);
}
