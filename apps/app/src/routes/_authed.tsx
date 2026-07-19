import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "@/auth/session";
import { AppHeader } from "@/ui/header/AppHeader";

export const Route = createFileRoute("/_authed")({
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
		return { user: session.user };
	},
	component: AuthedLayout,
});

function AuthedLayout() {
	return (
		<>
			<AppHeader />
			<Outlet />
		</>
	);
}
