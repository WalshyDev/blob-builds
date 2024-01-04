-- SQLite (what D1 runs) is very limited in SQL annoyingly and doesn't let us modify columns
-- therefore, we're gonna need to make a new table, move the data over, and then delete the old table
-- in order to remove the bad constraint on user_id (remove cascade delete)

-- Taken from migration 0000 + 0003
CREATE TABLE IF NOT EXISTS `projects_new` (
	`project_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL COLLATE NOCASE,
	`description` text NOT NULL,
	`repo_link` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX IF NOT EXISTS `projects_name_idx` ON `projects_new` (`name`);--> statement-breakpoint

-- Copy data over
INSERT INTO projects_new SELECT * FROM projects;

-- Rename the old table
ALTER TABLE projects RENAME TO projects_old;

-- Ok sooo... this is where things get a little janky
-- SQLite will follow renames for references, which is nice... but not when doing this trick
-- So we're gonna drop _old, rename _new to _old and then finally back to `projects`
-- This tricks updating the references
DROP INDEX IF EXISTS `projects_name_idx`;
DROP TABLE projects_old;
ALTER TABLE projects_new RENAME TO projects_old;

-- Rename the new (now called _old) table to be active
ALTER TABLE projects_old RENAME TO projects;

-- Remake index
CREATE INDEX IF NOT EXISTS `projects_name_idx` ON `projects` (`name`);--> statement-breakpoint
