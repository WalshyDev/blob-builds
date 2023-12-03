interface BuildsJson {
	[buildId: string]: {
		id: number;
		sha: string;
		date: string;
		timestamp: number;
		message: string;
		author: string;
		avatar: string;
		license: {
				name: string;
				id: string;
				url: string;
		},
		candidate: string;
		status: 'SUCCESS' | 'FAILED' | 'COMPILE_ONLY';
	}
}

interface OldBuild {
	id: number;
	commitSha: string;
	changelog: string;
	timestamp: number;
	status: 'SUCCESS' | 'FAILED' | 'COMPILE_ONLY';
}

interface BlobBuild {
	projectName: string;
	releaseChannel: string;
	buildId: number;
	fileHash: string;
	fileDownloadUrl: string;
	supportedVersions: string;
	dependencies: string[];
	releaseNotes: string;
}

interface BlobBuilds {
	success: boolean;
	error?: string;
	data?: {
		[releaseChannel: string]: BlobBuild[];
	}
}
