import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "#/integrations/better-auth/auth-client";

export const Route = createFileRoute("/auth/sign-in")({
	component: SignIn,
});

function SignIn() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		const { error } = await authClient.signIn.email({
			email: data.get("email") as string,
			password: data.get("password") as string,
		});
		if (error) {
			setError(error.message ?? "Sign in failed");
		} else {
			navigate({ to: "/" });
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<form
				onSubmit={handleSubmit}
				className="flex flex-col gap-4 w-80 p-8 rounded-2xl border border-black/10 bg-white shadow-lg"
			>
				<h1 className="text-xl font-semibold">Sign in</h1>
				{error && <p className="text-sm text-red-500">{error}</p>}
				<input
					name="email"
					type="email"
					placeholder="Email"
					required
					className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-dark-grey"
				/>
				<input
					name="password"
					type="password"
					placeholder="Password"
					required
					className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-dark-grey"
				/>
				<button
					type="submit"
					className="rounded-lg bg-dark-grey py-2 text-sm text-white hover:opacity-90"
				>
					Sign in
				</button>
				<a
					href="/sign-up"
					className="text-center text-sm text-dark-grey/60 hover:underline"
				>
					No account? Sign up
				</a>
			</form>
		</div>
	);
}
