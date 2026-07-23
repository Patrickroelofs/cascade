/**
 * A calendar date as `YYYY-MM-DD` — a day, not an instant. Node due dates
 * are stored and transmitted in this form (see #323) so the day they name
 * never shifts under timezone conversion; `parseCalendarDate`/
 * `formatCalendarDate` are the only places that should cross into/out of a
 * local `Date`, for UI components that need one (calendar pickers, day math).
 */
export type CalendarDateString = string;

const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Rejects malformed strings and impossible dates (e.g. "2026-02-30"). */
export function isValidCalendarDateString(value: string): boolean {
	const match = calendarDatePattern.exec(value);
	if (!match) return false;
	const [, year, month, day] = match;
	const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
	return (
		date.getUTCFullYear() === Number(year) &&
		date.getUTCMonth() === Number(month) - 1 &&
		date.getUTCDate() === Number(day)
	);
}

/** Parses a calendar date into local midnight, for local display/day-math. */
export function parseCalendarDate(value: CalendarDateString): Date {
	const [year, month, day] = value.split("-").map(Number);
	return new Date(year, month - 1, day);
}

/** Formats a local `Date`'s calendar day back to `YYYY-MM-DD`. */
export function formatCalendarDate(date: Date): CalendarDateString {
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
}
