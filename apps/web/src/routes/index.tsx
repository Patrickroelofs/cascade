import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="p-8">
			<a href="https://app.cascadelist.com">Open app</a>
		</div>
	);
}
