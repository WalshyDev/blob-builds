import type { AstroGlobal } from 'astro';

export function getProjects(locals: App.Locals) {
	return _fetch<ProjectResponse[]>(locals, '/projects');
}

export function getProject(locals: App.Locals, projectName: string) {
	return _fetch<ProjectResponse>(locals, `/projects/${projectName}`);
}

export interface ProjectBuilds {
	[releaseChannel: string]: BuildResponse[];
}

export function getAllProjectBuilds(
	locals: App.Locals,
	projectName: string,
	page = 1,
	perPage = 100,
) {
	return _fetch<ProjectBuilds>(locals, `/builds/${projectName}?page=${page}&per_page=${perPage}`);
}

export function getProjectBuilds(
	locals: App.Locals,
	projectName: string,
	releaseChannel: string,
	page = 1,
	perPage = 100,
) {
	return _fetch<ProjectBuilds>(locals, `/builds/${projectName}/${releaseChannel}?page=${page}&per_page=${perPage}`);
}

interface UserResponse {
	name: string;
	oauthProvider: string;
	oauthId: string;
	apiToken: string;
}

export function getUser(global: AstroGlobal) {
	return _fetch<UserResponse>(global.locals, '/users/@me', global.request);
}

export function _fetch<T = unknown>(
	locals: App.Locals,
	path: string,
	requestInit?: RequestInit,
): Promise<ApiResponse<T>> {
	console.log(`[API] Fetching ${path}`);

	return locals.runtime.env.API.fetch(`https://worker.local/api${path}`, requestInit)
		.then((res) => res.json() as Promise<ApiResponse<T>>);
}

type ApiResponse<T = unknown> = ApiResponseSuccess<T> | ApiResponseError;

interface ApiResponseSuccess<T = unknown> {
	success: true;
	data: T;
	pagination?: Pagination;
}

interface ApiResponseError {
	success: false;
	code: number;
	error: string;
}
