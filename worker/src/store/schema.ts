import { index, int, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// TODO: Auth stuff
export const users = sqliteTable('users', {
	userId: integer('user_id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(), // COLLATE NOCASE -- added manually because can't do it in drizzle :(
	apiToken: text('api_token').notNull().unique(),
}, (table) => ({
	usersNameIdx: index('users_name_idx').on(table.name),
	usersApiTokenIdx: index('users_api_token_idx').on(table.apiToken),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const projects = sqliteTable('projects', {
	projectId: integer('project_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
	name: text('name').notNull(), // COLLATE NOCASE -- added manually because can't do it in drizzle :(
	description: text('description').notNull(),
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
	name: text('name').notNull(), // COLLATE NOCASE -- added manually because can't do it in drizzle :(
	supportedVersions: text('supported_versions').notNull(),
	dependencies: text('dependencies', { mode: 'json' }).notNull().$type<string[]>(),
	fileNaming: text('file_naming').notNull(),
}, (table) => ({
	releaseChannelsNameIdx: index('release_channels_name_idx').on(table.name),
}));

export type ReleaseChannel = typeof releaseChannels.$inferSelect;
export type InsertReleaseChannel = typeof releaseChannels.$inferInsert;

export const builds = sqliteTable('builds', {
	buildId: integer('build_id'),
	releaseChannelId: integer('release_channel_id').notNull()
		.references(() => releaseChannels.releaseChannelId, { onDelete: 'cascade' }),
	projectId: integer('project_id').notNull().references(() => projects.projectId, { onDelete: 'cascade' }),
	fileHash: text('file_hash').notNull(),
	supportedVersions: text('supported_versions').notNull(),
	dependencies: text('dependencies', { mode: 'json' }).notNull().$type<string[]>(),
	releaseNotes: text('release_notes').notNull(),
}, (table) => ({
	pk: primaryKey({ columns: [table.buildId, table.releaseChannelId] }),
}));

export type Build = typeof builds.$inferSelect;
export type BuildWithReleaseChannel = Build & { releaseChannel: string };
export type InsertBuild = typeof builds.$inferInsert;

// Types
function integer(name: string) {
	return int(name, { mode: 'number' });
}

function boolean(name: string) {
	return int(name, { mode: 'boolean' });
}
