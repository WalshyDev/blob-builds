ALTER TABLE projects ADD `wiki_link` text;--> statement-breakpoint
ALTER TABLE projects ADD `default_release_channel` integer REFERENCES release_channels(release_channel_id);

UPDATE projects SET default_release_channel = (
	SELECT MIN(release_channel_id)
	FROM release_channels
	LEFT JOIN projects ON projects.project_id = release_channels.project_id
	WHERE projects.project_id = release_channels.project_id
);
