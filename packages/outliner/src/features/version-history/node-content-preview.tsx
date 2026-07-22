import { useOutlinerLabels } from "../../labels-context";
import {
	lexicalToPlainText,
	toLexicalContent,
} from "../../lexical/lexical-content";
import { LexicalReadView } from "../../lexical/read/lexical-read-view";
import { DefaultNodeLink } from "../../node-link-slot";

export interface NodeContentPreviewRow {
	id: string;
	content: unknown;
	depth: number;
}

/** Read-only recreation of node content exactly as it looks in the outliner
 * — indentation and rich content, no interactions (drag, editing, context
 * menu) since there's nothing here to act on. Used for every version-history
 * entry in place of a content diff: a single row (depth 0) for a normal
 * content-edit version, or the whole deleted subtree's rows for a
 * `descendantsDeleted` marker entry (see `NodeVersionSummary`) — deletion
 * never changed any node's content, so there'd be nothing to diff there
 * either.
 *
 * A row with no text at all (content is `null`, or an edited-then-cleared
 * empty structure) renders a plain "Empty" label instead of `LexicalReadView`
 * — which would otherwise render an indistinguishable blank line, easy to
 * mistake for a rendering glitch. */
export function NodeContentPreview({
	rows,
	indentSize = 16,
}: {
	rows: NodeContentPreviewRow[];
	indentSize?: number;
}) {
	const labels = useOutlinerLabels();
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
						{lexicalToPlainText(row.content) === "" ? (
							<p className="text-muted italic dark:text-canvas/50">
								{labels.versionHistoryEmptyContent}
							</p>
						) : (
							<LexicalReadView content={toLexicalContent(row.content)} />
						)}
					</div>
				</div>
			))}
		</div>
	);
}
