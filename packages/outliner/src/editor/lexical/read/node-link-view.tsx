import type { ReactNode } from "react";
import { useOutlinerLabels } from "../../../i18n/outliner-labels-context";
import { EditableNodeLink } from "./editable-node-link";
import { nodeLinkClassName } from "./node-link.styles";
import { OpenLinkIcon } from "./open-link-icon";

export type OnSaveLink = (
	path: number[],
	update: { text: string; url: string },
) => void;

export type OnDeleteLink = (path: number[], update: { text: string }) => void;

interface NodeLinkViewProps {
	url: string;
	text: string;
	path: number[];
	onSaveLink?: OnSaveLink;
	onDeleteLink?: OnDeleteLink;
	children: ReactNode;
}

/** Renders a read-only link or the editable outliner link treatment. */
export function NodeLinkView({
	url,
	text,
	path,
	onSaveLink,
	onDeleteLink,
	children,
}: NodeLinkViewProps) {
	const labels = useOutlinerLabels();

	if (onSaveLink) {
		return (
			<EditableNodeLink
				url={url}
				text={text}
				path={path}
				onSaveLink={onSaveLink}
				onDeleteLink={onDeleteLink}
			>
				{children}
			</EditableNodeLink>
		);
	}

	return (
		<>
			<a
				href={url}
				title={url}
				target="_blank"
				rel="noreferrer"
				className={nodeLinkClassName}
				onClick={(event) => event.stopPropagation()}
			>
				{children}
			</a>
			<OpenLinkIcon url={url} label={labels.linkOpen} />
		</>
	);
}
