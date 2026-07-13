import { authClient } from "@cascade/auth/client";
import { Button } from "@cascade/ui/button";
import { CheckIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Footer } from "#/components/marketing/footer";
import { Nav } from "#/components/marketing/nav";
import { seoHead } from "#/lib/seo";
import { m } from "#/paraglide/messages.js";

// OAuth consent screen. The authorization server (better-auth's
// oauth-provider plugin) redirects here with the pending authorization
// request in the query string; authClient forwards it on the consent call.
export const Route = createFileRoute("/oauth/consent")({
	head: () => seoHead(m.consent_seo_title(), m.consent_seo_description()),
	validateSearch: z.object({
		client_id: z.string().optional(),
		scope: z.string().optional(),
	}),
	component: Consent,
});

function Consent() {
	const { client_id, scope } = Route.useSearch();
	const scopes = scope?.split(" ").filter((s) => s.length > 0) ?? [];
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function decide(accept: boolean) {
		setError(null);
		setSubmitting(true);

		const { data, error: consentError } = await authClient.oauth2.consent({
			accept,
		});

		if (consentError) {
			setSubmitting(false);
			setError(consentError.message ?? m.consent_error_fallback());
			return;
		}
		if (data?.url) {
			window.location.href = data.url;
		}
	}

	return (
		<>
			<Nav />
			<main className="mx-auto max-w-sm px-8 pt-16 pb-24 min-h-128">
				<h1 className="mb-8 text-center font-serif text-4xl italic">
					{m.consent_heading()}
				</h1>
				<p className="mb-6 text-center text-sm">
					<span className="font-bold">
						{client_id ?? m.consent_unknown_client()}
					</span>{" "}
					{m.consent_intro()}
				</p>
				{scopes.length > 0 && (
					<>
						<p className="mb-2 text-sm font-bold">
							{m.consent_scopes_heading()}
						</p>
						<ul className="mb-6 flex flex-col gap-1 text-sm text-graphite">
							{scopes.map((item) => (
								<li key={item} className="flex items-center gap-2">
									<CheckIcon className="size-3" weight="bold" />
									{item}
								</li>
							))}
						</ul>
					</>
				)}
				{error && (
					<p role="alert" className="mb-4 text-sm text-redleather">
						{error}
					</p>
				)}
				<div className="flex items-center justify-center gap-4">
					<button
						type="button"
						disabled={submitting}
						onClick={() => decide(false)}
						className="cursor-pointer rounded-full border border-graphite/30 px-6 py-3 text-sm font-bold"
					>
						{m.consent_deny()}
					</button>
					<Button
						type="button"
						disabled={submitting}
						onClick={() => decide(true)}
						icon={<CheckIcon className="size-4" weight="bold" />}
					>
						{m.consent_allow()}
					</Button>
				</div>
			</main>
			<Footer />
		</>
	);
}
