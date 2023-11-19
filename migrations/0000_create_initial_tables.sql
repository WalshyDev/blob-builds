-- Migration number: 0000 	 2023-06-16T22:08:00.700Z
CREATE TABLE IF NOT EXISTS users (
	user_id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	api_token TEXT NOT NULL
);

CREATE UNIQUE INDEX users_api_token ON users(api_token);

CREATE TABLE IF NOT EXISTS projects (
	project_id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER REFERENCES users(user_id),
	name TEXT NOT NULL COLLATE NOCASE,
	description TEXT NOT NULL
);

CREATE INDEX projects_name ON projects(name);

CREATE TABLE IF NOT EXISTS release_channels (
	release_channel_id INTEGER PRIMARY KEY AUTOINCREMENT,
	project_id INTEGER REFERENCES projects(project_id),
	name TEXT NOT NULL COLLATE NOCASE,
	supported_versions TEXT NOT NULL,
	dependencies JSON NOT NULL,
	file_naming TEXT NOT NULL
);

CREATE INDEX release_channels_name ON release_channels(name);

CREATE TABLE IF NOT EXISTS builds (
	build_id INTEGER PRIMARY KEY AUTOINCREMENT,
	release_channel_id INTEGER REFERENCES release_channels(release_channel_id),
	project_id INTEGER REFERENCES projects(project_id),
	file_hash TEXT NOT NULL,
	supported_versions TEXT NOT NULL,
	dependencies JSON NOT NULL,
	release_notes TEXT NOT NULL
);
