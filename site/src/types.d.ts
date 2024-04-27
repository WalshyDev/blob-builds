interface Env {
	API: {
		fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
	};

	CF_PAGES_URL?: string;
	CF_PAGES_BRANCH?: string;
}

interface Pagination {
	page: number;
	perPage: number;
	total: number;
}

interface ProjectResponse {
	name: string;
	owner?: string;
	description: string;
	downloads?: number; // TODO: not implemented yet
	repoLink?: string;
	wikiLink?: string;
	releaseChannels?: string[];
	defaultReleaseChannel: ReleaseChannel;
}

interface ProjectList {
	[owner: string]: ProjectResponse[];
}

interface ReleaseChannel {
	name: string;
	supportedVersions: string;
	dependencies: string[];
}

interface BuildResponse {
	projectName?: string;
	releaseChannel?: string;

	buildId: number;
	checksum: string;
	fileDownloadUrl: string;
	supportedVersions: string;
	dependencies?: string[];
	releaseNotes?: string;
	commitHash?: string;
	commitLink?: string;
}

interface UserResponse {
	name: string;
}
