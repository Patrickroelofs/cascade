import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.url(),
		PAYLOAD_SECRET: z.string().min(32),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
