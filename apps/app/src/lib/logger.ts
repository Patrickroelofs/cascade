type Level = "debug" | "info" | "warn" | "error";

const isProd = process.env.NODE_ENV === "production";

const levelOrder: Record<Level, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

function minLevel(): Level {
	const configured = process.env.LOG_LEVEL;
	if (configured && configured in levelOrder) return configured as Level;
	return isProd ? "info" : "debug";
}

function log(level: Level, message: string, meta?: Record<string, unknown>) {
	if (levelOrder[level] < levelOrder[minLevel()]) return;
	if (isProd) {
		// JSON lines for log aggregation
		console[level === "debug" ? "log" : level](
			JSON.stringify({
				level,
				message,
				time: new Date().toISOString(),
				...meta,
			}),
		);
	} else {
		console[level === "debug" ? "log" : level](
			`[${level}] ${message}`,
			meta ?? "",
		);
	}
}

export const logger = {
	debug: (message: string, meta?: Record<string, unknown>) =>
		log("debug", message, meta),
	info: (message: string, meta?: Record<string, unknown>) =>
		log("info", message, meta),
	warn: (message: string, meta?: Record<string, unknown>) =>
		log("warn", message, meta),
	error: (message: string, meta?: Record<string, unknown>) =>
		log("error", message, meta),
};
