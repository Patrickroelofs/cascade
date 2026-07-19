import type { AccessArgs } from "payload";

import type { User } from "#/payload-types";

type IsAuthenticated = (args: AccessArgs<User>) => boolean;

export const authenticated: IsAuthenticated = ({ req: { user } }) => {
	return Boolean(user);
};
