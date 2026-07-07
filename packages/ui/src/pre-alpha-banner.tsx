import { XIcon } from "@phosphor-icons/react/ssr";

export interface PreAlphaBannerProps {
	onDismiss?: () => void;
}

export function PreAlphaBanner({ onDismiss }: PreAlphaBannerProps) {
	return (
		<div className="relative flex items-center justify-center gap-2 bg-dark-grey px-8 py-2 text-center text-sm text-super-ginger">
			<span>
				Cascade is in <strong className="font-semibold">pre-alpha</strong> —
				expect bugs and breaking changes.
			</span>
			{onDismiss && (
				<button
					type="button"
					onClick={onDismiss}
					aria-label="Dismiss"
					className="absolute right-2 cursor-pointer rounded p-1 outline-none hover:bg-super-ginger/10"
				>
					<XIcon size={16} />
				</button>
			)}
		</div>
	);
}
