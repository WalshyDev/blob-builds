export function getProjects(locals: App.Locals) {
	return _fetch<Project[]>(locals, '/projects');
}

export function getProject(locals: App.Locals, projectName: string) {
	return _fetch<Project>(locals, `/projects/${projectName}`);
}

export interface ProjectBuilds {
	[releaseChannel: string]: Build[];
}

export function getAllProjectBuilds(locals: App.Locals, projectName: string) {
	return _fetch<ProjectBuilds>(locals, `/builds/${projectName}`);
}

export function getProjectBuilds(locals: App.Locals, projectName: string, releaseChannel: string) {
	return _fetch<ProjectBuilds>(locals, `/builds/${projectName}/${releaseChannel}`);
}

export function _fetch<T = unknown>(
	locals: App.Locals,
	path: string,
	requestInit?: RequestInit,
): Promise<ApiResponse<T>> {
	const apiUrl = locals.runtime.env.API_URL ?? 'https://blob.build';
	const url = `${apiUrl}/api${path}`;

	console.log(`[API] Fetching ${url}`);

	return fetch(url, requestInit).then((res) => res.json() as Promise<ApiResponse<T>>);
}

type ApiResponse<T = unknown> = ApiResponseSuccess<T> | ApiResponseError;

interface ApiResponseSuccess<T = unknown> {
	success: true;
	data: T;
}

interface ApiResponseError {
	success: false;
	code: number;
	error: string;
}
