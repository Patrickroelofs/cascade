import {
	MAX_TAG_LENGTH,
	type TagSummary,
} from "../../../nodes/model/node-tags";

interface TagEditorOptionInput {
	tags: string[];
	existingTags: TagSummary[];
	query: string;
	allowCreate: boolean;
}

export function deriveTagEditorOptions({
	tags,
	existingTags,
	query,
	allowCreate,
}: TagEditorOptionInput) {
	const trimmedQuery = query.trim();
	const currentLower = new Set(tags.map((tag) => tag.toLowerCase()));
	const allTags = includeOptimisticTags(tags, existingTags);
	const normalizedQuery = trimmedQuery.toLowerCase();
	const items =
		normalizedQuery === ""
			? allTags
			: allTags.filter((tag) =>
					tag.name.toLowerCase().includes(normalizedQuery),
				);
	const overLimit = trimmedQuery.length > MAX_TAG_LENGTH;
	const canCreate =
		allowCreate &&
		trimmedQuery !== "" &&
		!overLimit &&
		!allTags.some((tag) => tag.name.toLowerCase() === normalizedQuery);
	const createOffset = canCreate ? 1 : 0;

	return {
		trimmedQuery,
		currentLower,
		items,
		overLimit,
		showCount: MAX_TAG_LENGTH - trimmedQuery.length <= 15,
		canCreate,
		createOffset,
		optionCount: items.length + createOffset,
	};
}

function includeOptimisticTags(
	tags: string[],
	existingTags: TagSummary[],
): TagSummary[] {
	const known = new Set(existingTags.map((tag) => tag.name.toLowerCase()));
	const missing = tags
		.filter((tag) => !known.has(tag.toLowerCase()))
		.map((name) => ({ name, count: 1 }));
	return [...missing, ...existingTags];
}
