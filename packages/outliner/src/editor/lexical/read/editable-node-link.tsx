import { Input } from "@cascade/ui/input";
import { Popover, PopoverContent } from "@cascade/ui/popover";
import { ArrowSquareOutIcon, TrashIcon } from "@phosphor-icons/react";
import { type ReactNode, useRef, useState } from "react";
import { useOutlinerLabels } from "../../../i18n/outliner-labels-context";
import { MAX_URL_LENGTH, normalizeHttpUrl } from "../content/link-url";
import { nodeLinkClassName } from "./node-link.styles";
import type { OnDeleteLink, OnSaveLink } from "./node-link-view";
import { OpenLinkIcon } from "./open-link-icon";

interface EditableNodeLinkProps {
	url: string;
	text: string;
	path: number[];
	onSaveLink: OnSaveLink;
	onDeleteLink?: OnDeleteLink;
	children: ReactNode;
}

export function EditableNodeLink({
	url,
	text,
	path,
	onSaveLink,
	onDeleteLink,
	children,
}: EditableNodeLinkProps) {
	const labels = useOutlinerLabels();
	const anchorRef = useRef<HTMLAnchorElement>(null);
	const [open, setOpen] = useState(false);
	const [draftText, setDraftText] = useState(text);
	const [draftUrl, setDraftUrl] = useState(url);

	const normalizedUrl = normalizeHttpUrl(draftUrl);
	const canSave = normalizedUrl !== null && draftText.trim() !== "";

	const save = () => {
		if (normalizedUrl === null) return;
		const trimmedText = draftText.trim();
		if (trimmedText === "") return;

		onSaveLink(path, { text: trimmedText, url: normalizedUrl });
		setOpen(false);
	};

	const removeLink = () => {
		onDeleteLink?.(path, { text: draftText.trim() || text || url });
		setOpen(false);
	};

	return (
		<>
			<a
				ref={anchorRef}
				href={url}
				title={url}
				className={nodeLinkClassName}
				aria-haspopup="dialog"
				aria-expanded={open}
				onClick={(event) => {
					event.preventDefault();
					event.stopPropagation();
					setDraftText(text);
					setDraftUrl(url);
					setOpen(true);
				}}
				onKeyDown={(event) => event.stopPropagation()}
			>
				{children}
			</a>
			<OpenLinkIcon url={url} label={labels.linkOpen} />
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverContent
					anchor={anchorRef}
					aria-label={labels.linkEditTitle}
					className="w-72"
				>
					<form
						className="flex flex-col gap-3"
						onClick={(event) => event.stopPropagation()}
						onKeyDown={(event) => {
							if (event.key !== "Escape") event.stopPropagation();
						}}
						onSubmit={(event) => {
							event.preventDefault();
							save();
						}}
					>
						<Input
							label={labels.linkTextLabel}
							value={draftText}
							autoFocus
							onChange={(event) => setDraftText(event.target.value)}
						/>
						<Input
							label={labels.linkUrlLabel}
							value={draftUrl}
							maxLength={MAX_URL_LENGTH}
							aria-invalid={normalizedUrl === null || undefined}
							onChange={(event) => setDraftUrl(event.target.value)}
						/>
						<div className="flex items-center justify-between gap-2">
							<a
								href={url}
								target="_blank"
								rel="noreferrer"
								className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm outline-none hover:bg-surface/70 focus-visible:ring-2 focus-visible:ring-danger/50 dark:hover:bg-surface/20"
							>
								<ArrowSquareOutIcon size="1em" />
								{labels.linkOpen}
							</a>
							<div className="flex items-center gap-2">
								{onDeleteLink && (
									<button
										type="button"
										aria-label={labels.linkDelete}
										title={labels.linkDelete}
										onClick={removeLink}
										className="cursor-pointer rounded-md p-1.5 text-sm outline-none hover:bg-surface/70 focus-visible:ring-2 focus-visible:ring-danger/50 dark:hover:bg-surface/20"
									>
										<TrashIcon size="1.15em" />
									</button>
								)}
								<button
									type="submit"
									disabled={!canSave}
									className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-sm text-canvas outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-40"
								>
									{labels.linkSave}
								</button>
							</div>
						</div>
					</form>
				</PopoverContent>
			</Popover>
		</>
	);
}
