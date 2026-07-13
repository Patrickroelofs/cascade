import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text().primaryKey(),
	name: text().notNull(),
	email: text().notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const session = pgTable("session", {
	id: text().primaryKey(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	token: text().notNull().unique(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const account = pgTable("account", {
	id: text().primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", {
		withTimezone: true,
	}),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
		withTimezone: true,
	}),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const verification = pgTable("verification", {
	id: text().primaryKey(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

// Signing keys for the jwt plugin, which backs OAuth access tokens.
export const jwks = pgTable("jwks", {
	id: text().primaryKey(),
	publicKey: text("public_key").notNull(),
	privateKey: text("private_key").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }),
});

// OAuth 2.1 provider tables (MCP client authentication).
export const oauthClient = pgTable("oauth_client", {
	id: text().primaryKey(),
	clientId: text("client_id").notNull().unique(),
	clientSecret: text("client_secret"),
	disabled: boolean().default(false),
	skipConsent: boolean("skip_consent"),
	enableEndSession: boolean("enable_end_session"),
	subjectType: text("subject_type"),
	scopes: text().array(),
	userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { withTimezone: true }),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
	name: text(),
	uri: text(),
	icon: text(),
	contacts: text().array(),
	tos: text(),
	policy: text(),
	softwareId: text("software_id"),
	softwareVersion: text("software_version"),
	softwareStatement: text("software_statement"),
	redirectUris: text("redirect_uris").array().notNull(),
	postLogoutRedirectUris: text("post_logout_redirect_uris").array(),
	tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
	grantTypes: text("grant_types").array(),
	responseTypes: text("response_types").array(),
	public: boolean(),
	type: text(),
	requirePKCE: boolean("require_pkce"),
	referenceId: text("reference_id"),
	metadata: jsonb(),
});

export const oauthRefreshToken = pgTable("oauth_refresh_token", {
	id: text().primaryKey(),
	token: text().notNull().unique(),
	clientId: text("client_id")
		.notNull()
		.references(() => oauthClient.clientId, { onDelete: "cascade" }),
	sessionId: text("session_id").references(() => session.id, {
		onDelete: "set null",
	}),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	referenceId: text("reference_id"),
	expiresAt: timestamp("expires_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true }),
	revoked: timestamp({ withTimezone: true }),
	authTime: timestamp("auth_time", { withTimezone: true }),
	scopes: text().array().notNull(),
});

export const oauthAccessToken = pgTable("oauth_access_token", {
	id: text().primaryKey(),
	token: text().unique(),
	clientId: text("client_id")
		.notNull()
		.references(() => oauthClient.clientId, { onDelete: "cascade" }),
	sessionId: text("session_id").references(() => session.id, {
		onDelete: "set null",
	}),
	userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
	referenceId: text("reference_id"),
	refreshId: text("refresh_id").references(() => oauthRefreshToken.id, {
		onDelete: "cascade",
	}),
	expiresAt: timestamp("expires_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true }),
	scopes: text().array().notNull(),
});

export const oauthConsent = pgTable("oauth_consent", {
	id: text().primaryKey(),
	clientId: text("client_id")
		.notNull()
		.references(() => oauthClient.clientId, { onDelete: "cascade" }),
	userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
	referenceId: text("reference_id"),
	scopes: text().array().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
});
