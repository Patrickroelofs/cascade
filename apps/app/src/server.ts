import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";
import { FastResponse } from "srvx";

globalThis.Response = FastResponse;

const startHandler = createStartHandler(defaultStreamHandler);

const securityHeaders: Record<string, string> = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	// 'unsafe-inline' is required for now: TanStack Start SSR injects inline
	// hydration scripts and React inline styles are used. Still blocks all
	// external script/style/image origins.
	"Content-Security-Policy":
		"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	...(process.env.NODE_ENV === "production" && {
		"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
	}),
};

export default {
	async fetch(request: Request): Promise<Response> {
		const response = await startHandler(request);
		for (const [key, value] of Object.entries(securityHeaders)) {
			response.headers.set(key, value);
		}
		return response;
	},
};
