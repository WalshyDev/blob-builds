interface Env {
	DB: D1Database;
}

interface User {
	user_id: number;
	name: string;
}

interface Project {
	project_id: number;
	user_id: number;
	name: string;
	description: string;
}

interface ReleaseChannel {
	release_channel_id: number;
	project_id: number;
	name: string;
	supported_versions: string;
	dependencies: string[];
	file_naming: string;
}

interface Build {
	build_id: number;
	release_channel_id: number;
	project_id: number;
	file_hash: string;
	supported_versions: string;
	dependencies: string[];
	release_notes: string;
}
