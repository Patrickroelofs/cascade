import { ArrowSquareOutIcon } from "@phosphor-icons/react";

export function OpenLinkIcon({ url, label }: { url: string; label: string }) {
	return (
		<a
			href={url}
			target="_blank"
			rel="noreferrer"
			aria-label={label}
			title={url}
			className="inline-block align-[-0.1em] ml-0.5 text-danger hover:text-danger/70 dark:text-accent dark:hover:text-accent/70"
			onClick={(event) => event.stopPropagation()}
		>
			<ArrowSquareOutIcon size="0.9em" />
		</a>
	);
}
