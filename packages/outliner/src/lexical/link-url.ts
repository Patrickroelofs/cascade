export const MAX_URL_LENGTH = 2048;
export const TIDY_LABEL_MAX_LENGTH = 40;
const EDGE_SLASHES = /^\/+|\/+$/g;
const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_FIRST_BLOCK_REGEX = /^[0-9a-f]{8}$/i;

/**
 * Only http(s) URLs are ever turned into links on paste or rendered with an
 * href, so a stored `javascript:`/`data:` URL can never become clickable.
 */
export function isHttpUrl(value: string): boolean {
	if (!/^https?:\/\//i.test(value)) return false;
	if (value.length > MAX_URL_LENGTH) return false;
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
}

/**
 * Normalizes free-form popover input to an http(s) URL, prepending `https://`
 * when no scheme was typed (`example.com/a` → `https://example.com/a`).
 * Returns null when the input can't be an http(s) URL at all.
 */
export function normalizeHttpUrl(input: string): string | null {
	const trimmed = input.trim();
	if (trimmed === "" || /\s/.test(trimmed)) return null;
	const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
		? trimmed
		: `https://${trimmed}`;
	return isHttpUrl(candidate) ? candidate : null;
}

function isNodeSlugId(value: string): boolean {
	return UUID_REGEX.test(value) || UUID_FIRST_BLOCK_REGEX.test(value);
}

/**
 * Returns true when the URL looks like a Cascade node detail route. Those
 * should stay in the current window so node-to-node links behave like app
 * navigation instead of opening a new tab.
 */
export function isNodeDetailUrl(url: string): boolean {
	if (!isHttpUrl(url)) return false;
	try {
		const path = decodeURIComponent(new URL(url).pathname).replace(
			EDGE_SLASHES,
			"",
		);
		if (!path || path.includes("/")) return false;
		if (isNodeSlugId(path)) return true;

		const legacyDelimiterIndex = path.lastIndexOf("--");
		if (legacyDelimiterIndex >= 0) {
			return isNodeSlugId(path.slice(legacyDelimiterIndex + 2));
		}

		const delimiterIndex = path.lastIndexOf("-");
		if (delimiterIndex < 0) return false;
		return isNodeSlugId(path.slice(delimiterIndex + 1));
	} catch {
		return false;
	}
}

/**
 * Human-friendly display text for a URL: hostname without `www.` plus the
 * path/query/hash, truncated with an ellipsis. Used as the initial link text
 * when a pasted URL is converted into a link.
 */
export function tidyUrlLabel(
	url: string,
	maxLength = TIDY_LABEL_MAX_LENGTH,
): string {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return url.length <= maxLength ? url : `${url.slice(0, maxLength - 1)}…`;
	}
	const host = parsed.hostname.replace(/^www\./, "");
	const rest = `${parsed.pathname}${parsed.search}${parsed.hash}`;
	const label = rest === "/" ? host : `${host}${rest}`;
	if (label.length <= maxLength) return label;
	return `${label.slice(0, maxLength - 1)}…`;
}
