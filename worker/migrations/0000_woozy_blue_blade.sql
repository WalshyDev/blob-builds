CREATE TABLE IF NOT EXISTS `builds` (
	`build_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`release_channel_id` integer NOT NULL,
	`project_id` integer NOT NULL,
	`file_hash` text NOT NULL,
	`supported_versions` text NOT NULL,
	`dependencies` text NOT NULL,
	`release_notes` text NOT NULL,
	FOREIGN KEY (`release_channel_id`) REFERENCES `release_channels`(`release_channel_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `projects` (
	`project_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL COLLATE NOCASE,
	`description` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `release_channels` (
	`release_channel_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`name` text NOT NULL COLLATE NOCASE,
	`supported_versions` text NOT NULL,
	`dependencies` text NOT NULL,
	`file_naming` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`user_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL COLLATE NOCASE,
	`api_token` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `projects_name_idx` ON `projects` (`name`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `release_channels_name_idx` ON `release_channels` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_api_token_unique` ON `users` (`api_token`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `users_name_idx` ON `users` (`name`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `users_api_token_idx` ON `users` (`api_token`);
