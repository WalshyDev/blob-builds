type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

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

// Responses
interface BuildResponse {
	projectName: string;
	releaseChannel: string;
	buildId: number;
	build_id: number; // TODO: Remove - here to keep compatibility for auto-updater
	fileHash: string;
	fileDownloadUrl: string;
	file_download_url: string; // TODO: Remove - here to keep compatibility for auto-updater
	supportedVersions: string;
  dependencies: string[];
  releaseNotes: string;
}

interface BuildList {
	[releaseChannel: string]: BuildResponse[];
}
