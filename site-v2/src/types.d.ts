interface Project {
	name: string;
	description: string;
	github?: string;
	wiki?: string;
	downloads: number;
	supportedVersions?: string;
	dependencies?: string[];
	repoLink?: string;
}

interface ProjectList {
	[owner: string]: Project[];
}

interface Build {
	buildId: number;
	checksum: string;
	fileDownloadUrl: string;
	supportedVersions: string;
	dependencies?: string[];
	releaseNotes?: string;
	commitHash?: string;
	commitLink?: string;
}
