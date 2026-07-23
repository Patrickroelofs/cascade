import { type KeyboardEvent, useMemo, useRef, useState } from "react";
import { normalizeTags, type TagSummary } from "../../../nodes/model/node-tags";
import { deriveTagEditorOptions } from "../model/tag-editor-options";

interface UseTagEditorOptions {
	tags: string[];
	existingTags: TagSummary[];
	onChange: (tags: string[]) => void;
	allowCreate?: boolean;
}

/** Drives the tag combobox: filtering, keyboard nav, and create/toggle. */
export function useTagEditor({
	tags,
	existingTags,
	onChange,
	allowCreate = true,
}: UseTagEditorOptions) {
	const [query, setQuery] = useState("");
	const [highlighted, setHighlighted] = useState(-1);
	const inputRef = useRef<HTMLInputElement>(null);

	const {
		trimmedQuery,
		currentLower,
		items,
		overLimit,
		showCount,
		canCreate,
		createOffset,
		optionCount,
	} = useMemo(
		() =>
			deriveTagEditorOptions({
				tags,
				existingTags,
				query,
				allowCreate,
			}),
		[allowCreate, existingTags, query, tags],
	);

	const resetHighlight = () => setHighlighted(-1);

	const createTag = () => {
		onChange(normalizeTags([...tags, trimmedQuery]));
		setQuery("");
		resetHighlight();
		inputRef.current?.focus();
	};

	const toggleTag = (name: string) => {
		onChange(
			currentLower.has(name.toLowerCase())
				? tags.filter((t) => t.toLowerCase() !== name.toLowerCase())
				: normalizeTags([...tags, name]),
		);
		// Reset the filter so the next keystroke starts a fresh search and the
		// full list reflects the toggle just made.
		setQuery("");
		resetHighlight();
		inputRef.current?.focus();
	};

	const activateOption = (index: number) => {
		if (canCreate && index === 0) createTag();
		else if (items[index - createOffset])
			toggleTag(items[index - createOffset].name);
	};

	const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		// The context menu's typeahead (jump to a menu item by typing its first
		// letter) listens on this popup and calls preventDefault() for every
		// printable-character keydown, with no awareness that focus might be
		// inside this text field — which silently ate every keystroke typed
		// here. Stop those specifically before they can reach that listener;
		// Escape is deliberately left alone so it still closes the menu (its
		// dismiss listener lives on `document`, outside this component tree).
		if (event.key.length === 1) {
			event.stopPropagation();
		}

		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			if (optionCount === 0) return;
			event.preventDefault();
			const step = event.key === "ArrowDown" ? 1 : -1;
			setHighlighted((i) => Math.max(-1, Math.min(i + step, optionCount - 1)));
			return;
		}
		if (event.key === "Escape") {
			if (highlighted !== -1) {
				event.stopPropagation();
				resetHighlight();
			}
			return;
		}
		if (event.key !== "Enter") return;
		event.preventDefault();
		if (highlighted >= 0) {
			activateOption(highlighted);
		} else if (canCreate) {
			createTag();
		} else if (trimmedQuery && items[0]) {
			toggleTag(items[0].name);
		}
	};

	return {
		query,
		setQuery,
		highlighted,
		inputRef,
		trimmedQuery,
		currentLower,
		items,
		overLimit,
		showCount,
		canCreate,
		createOffset,
		optionCount,
		resetHighlight,
		createTag,
		toggleTag,
		handleInputKeyDown,
	};
}
