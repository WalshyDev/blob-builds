type ApiResponse<T = unknown> = ApiResponseSuccess<T> | ApiResponseError;

interface ApiResponseSuccess<T> {
	success: true;
	message: string;
	data: T | null;
}

interface ApiResponseError {
	success: false;
	code: number;
	error: string;
	stack?: string;
}

// Responses
interface BuildResponse {
	projectName: string;
	releaseChannel: string;
	buildId: number;
	build_id: number; // TODO: Remove - here to keep compatibility for auto-updater
	checksum: string;
	fileDownloadUrl: string;
	file_download_url: string; // TODO: Remove - here to keep compatibility for auto-updater
	supportedVersions: string;
	dependencies: string[];
	releaseNotes: string;
	commitHash?: string;
	commitLink?: string;
}

interface BuildList {
	[releaseChannel: string]: BuildResponse[];
}
