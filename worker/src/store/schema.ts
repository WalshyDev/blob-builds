import { AnySQLiteColumn, index, int, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	userId: integer('user_id').primaryKey({ autoIncrement: true }),
	name: txt('name').notNull(), // COLLATE NOCASE -- added manually because can't do it in drizzle :(
	// TODO: Move to notNull when we've migrated
	oauthProvider: txt('oauth_provider'),
	oauthId: txt('oauth_id'),
	apiToken: txt('api_token').notNull().unique(),
}, (table) => ({
	usersNameIdx: index('users_name_idx').on(table.name),
	usersApiTokenIdx: index('users_api_token_idx').on(table.apiToken),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const projects = sqliteTable('projects', {
	projectId: integer('project_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
	name: txt('name').notNull(), // COLLATE NOCASE -- added manually because can't do it in drizzle :(
	description: txt('description').notNull(),
	repoLink: txt('repo_link'),
	wikiLink: txt('wiki_link'),
	// TODO: Would be good to make this non-null in the future
	defaultReleaseChannel: integer('default_release_channel')
		.references((): AnySQLiteColumn => releaseChannels.releaseChannelId),
}, (table) => ({
	projectsNameIdx: index('projects_name_idx').on(table.name),
}));

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export const projectSettings = sqliteTable('project_settings', {
	projectId: integer('project_id').primaryKey().references(() => projects.projectId, { onDelete: 'cascade' }),
	overwritePluginYml: boolean('overwrite_plugin_yml').notNull().default(true),
});

export type ProjectSettings = typeof projectSettings.$inferSelect;
export type InsertProjectSettings = typeof projectSettings.$inferInsert;

export const releaseChannels = sqliteTable('release_channels', {
	releaseChannelId: integer('release_channel_id').primaryKey({ autoIncrement: true }),
	projectId: integer('project_id').notNull().references(() => projects.projectId, { onDelete: 'cascade' }),
	name: txt('name').notNull(), // COLLATE NOCASE -- added manually because can't do it in drizzle :(
	supportedVersions: txt('supported_versions').notNull(),
	dependencies: json('dependencies').notNull().$type<string[]>(),
	fileNaming: txt('file_naming').notNull(),
}, (table) => ({
	releaseChannelsNameIdx: index('release_channels_name_idx').on(table.name),
}));

export type ReleaseChannel = typeof releaseChannels.$inferSelect;
export type InsertReleaseChannel = typeof releaseChannels.$inferInsert;

export const builds = sqliteTable('builds', {
	buildId: integer('build_id').notNull(),
	releaseChannelId: integer('release_channel_id').notNull()
		.references(() => releaseChannels.releaseChannelId, { onDelete: 'cascade' }),
	projectId: integer('project_id').notNull().references(() => projects.projectId, { onDelete: 'cascade' }),
	fileHash: txt('file_hash').notNull(),
	supportedVersions: txt('supported_versions').notNull(),
	dependencies: json('dependencies').notNull().$type<string[]>(),
	releaseNotes: txt('release_notes').notNull(),
	commitHash: txt('commit_hash'),
}, (table) => ({
	pk: primaryKey({ columns: [table.buildId, table.releaseChannelId] }),
}));

export type Build = typeof builds.$inferSelect;
export type BuildWithReleaseChannel = Build & { releaseChannel: string };
export type InsertBuild = typeof builds.$inferInsert;

export const sessions = sqliteTable('sessions', {
	sessionId: txt('session_id').notNull().primaryKey(),
	userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
	createdAt: integer('created_at').notNull(),
	expiresAt: integer('expires_at').notNull(),
}, (table) => ({
	sessionsUserIdIdx: index('sessions_user_id_idx').on(table.userId),
}));

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export const oauthState = sqliteTable('oauth_state', {
	state: txt('state').notNull().primaryKey(),
	createdAt: integer('created_at').notNull(),
	expiresAt: integer('expires_at').notNull(),
});

export type OAuthState = typeof oauthState.$inferSelect;
export type InsertOAuthState = typeof oauthState.$inferInsert;

// Types
function integer(name: string) {
	return int(name, { mode: 'number' });
}

function boolean(name: string) {
	return int(name, { mode: 'boolean' });
}

function txt(name: string) {
	return text(name, { mode: 'text' });
}

function json(name: string) {
	return text(name, { mode: 'json' });
}
