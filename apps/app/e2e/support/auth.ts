import type { APIRequestContext } from "@playwright/test";
import { env } from "./env";

/**
 * Creates the shared e2e test user via better-auth's own REST API — the
 * same `auth.api.signUpEmail` path `src/db/seed.ts` uses for the dev user,
 * just called over HTTP so no DB credentials are needed in the test
 * process. Idempotent: a second run finds the user already exists and
 * moves on.
 */
export async function ensureTestUser(
	request: APIRequestContext,
): Promise<void> {
	const response = await request.post(`${env.appUrl}/api/auth/sign-up/email`, {
		data: {
			email: env.testUserEmail,
			password: env.testUserPassword,
			name: env.testUserName,
		},
	});
	if (response.ok()) return;

	const body = await response.json().catch(() => ({}));
	const alreadyExists =
		typeof body.code === "string" && body.code.includes("USER_ALREADY_EXISTS");
	if (!alreadyExists) {
		throw new Error(
			`Failed to create e2e test user (${response.status()}): ${JSON.stringify(body)}`,
		);
	}
}

/** Signs in as the e2e test user, leaving the session cookie on `request`'s context. */
export async function signInTestUser(
	request: APIRequestContext,
): Promise<void> {
	const response = await request.post(`${env.appUrl}/api/auth/sign-in/email`, {
		data: {
			email: env.testUserEmail,
			password: env.testUserPassword,
		},
	});
	if (!response.ok()) {
		const body = await response.json().catch(() => ({}));
		throw new Error(
			`Failed to sign in as e2e test user (${response.status()}): ${JSON.stringify(body)}`,
		);
	}
}
