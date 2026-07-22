import { toLexicalContent } from "../../lexical/lexical-content";
import { LexicalReadView } from "../../lexical/read/lexical-read-view";
import { DefaultNodeLink } from "../../node-link-slot";

export interface DeletedTreePreviewRow {
	id: string;
	content: unknown;
	depth: number;
}

/** Read-only recreation of a deleted node's subtree exactly as it looked in
 * the outliner at delete time — indentation and rich content, no
 * interactions (drag, editing, context menu) since there's nothing here to
 * act on. Used in place of a content diff for a `descendantsDeleted` marker
 * entry (see `NodeVersionSummary`), since deletion never changed any node's
 * content — there'd be nothing to diff. */
export function DeletedTreePreview({
	rows,
	indentSize = 16,
}: {
	rows: DeletedTreePreviewRow[];
	indentSize?: number;
}) {
	return (
		<div className="flex flex-col gap-1 overflow-auto p-2">
			{rows.map((row) => (
				<div
					key={row.id}
					className="flex items-start gap-2"
					style={{ paddingLeft: row.depth * indentSize }}
				>
					<span className="mt-2 shrink-0" aria-hidden>
						<DefaultNodeLink />
					</span>
					<div className="min-w-0 flex-1">
						<LexicalReadView content={toLexicalContent(row.content)} />
					</div>
				</div>
			))}
		</div>
	);
}
