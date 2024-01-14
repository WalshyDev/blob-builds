interface Project {
	name: string;
	description: string;
	github?: string;
	wiki?: string;
	downloads: number;
	supportedVersions?: string;
	dependencies?: string[];
}

interface ProjectList {
	[owner: string]: Project[];
}
