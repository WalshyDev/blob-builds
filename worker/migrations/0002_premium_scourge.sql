CREATE TABLE `project_settings` (
	`project_id` integer PRIMARY KEY NOT NULL,
	`overwrite_plugin_yml` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON UPDATE no action ON DELETE cascade
);

-- Insert all existing projects into the new table
INSERT INTO `project_settings` (`project_id`, `overwrite_plugin_yml`) SELECT `project_id`, 1 FROM `projects`;
