-- SQLite (what D1 runs) is very limited in SQL annoyingly and doesn't let us modify columns
-- therefore, we're gonna need to make a new table, move the data over, and then delete the old table
-- in order to remove the PK + autoincrement on build_id

-- Taken from migration 0000
CREATE TABLE IF NOT EXISTS `builds_new` (
	`build_id` integer NOT NULL,
	`release_channel_id` integer NOT NULL,
	`project_id` integer NOT NULL,
	`file_hash` text NOT NULL,
	`supported_versions` text NOT NULL,
	`dependencies` text NOT NULL,
	`release_notes` text NOT NULL,
	FOREIGN KEY (`release_channel_id`) REFERENCES `release_channels`(`release_channel_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade,
	PRIMARY KEY (`build_id`, `release_channel_id`)
);

-- Copy data over
INSERT INTO builds_new SELECT * FROM builds;

-- Rename the old table
ALTER TABLE builds RENAME TO builds_old;

-- Rename the new table to be active
ALTER TABLE builds_new RENAME TO builds;

-- Drop the old table
DROP TABLE builds_old;
