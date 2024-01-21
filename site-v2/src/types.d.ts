interface Env {
	API_URL: string;
}

interface Project {
	name: string;
	owner: string;
	description: string;
	downloads?: number; // TODO: not implemented yet
	repoLink?: string;
	wikiLink?: string;
	defaultReleaseChannel: ReleaseChannel;
}

interface ProjectList {
	[owner: string]: (Project & { owner: string })[];
}

interface ReleaseChannel {
	name: string;
	supportedVersions: string;
	dependencies: string[];
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
