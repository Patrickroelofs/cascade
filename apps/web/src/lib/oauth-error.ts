const MESSAGES: Record<string, string> = {
	account_not_linked:
		"That email is already registered with a different sign-in method. Log in with your original method, or use a different email.",
};

export function oauthErrorMessage(code: string | undefined): string | null {
	if (!code) return null;
	return MESSAGES[code] ?? "Something went wrong signing you in. Try again.";
}
