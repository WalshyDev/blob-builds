ALTER TABLE users ADD `flags` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE users ADD `beta_flags` text DEFAULT '[]' NOT NULL;
