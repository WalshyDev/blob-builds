import type { APIContext, AstroGlobal } from 'astro';

type AstroCtx = AstroGlobal | APIContext;

export function getProjects(ctx: AstroCtx) {
	return _fetch<ProjectResponse[]>(ctx, '/projects');
}

export function getProject(ctx: AstroCtx, projectName: string) {
	return _fetch<ProjectResponse>(ctx, `/projects/${projectName}`);
}

export interface ProjectBuilds {
	[releaseChannel: string]: BuildResponse[];
}

export function getAllProjectBuilds(
	ctx: AstroCtx,
	projectName: string,
	page = 1,
	perPage = 100,
) {
	return _fetch<ProjectBuilds>(ctx, `/builds/${projectName}?page=${page}&per_page=${perPage}`);
}

export function getProjectBuilds(
	ctx: AstroCtx,
	projectName: string,
	releaseChannel: string,
	page = 1,
	perPage = 100,
) {
	return _fetch<ProjectBuilds>(ctx, `/builds/${projectName}/${releaseChannel}?page=${page}&per_page=${perPage}`);
}

interface UserResponse {
	name: string;
	oauthProvider: string;
	oauthId: string;
	apiToken: string;
}

export function getUser(ctx: AstroCtx) {
	return _fetch<UserResponse>(ctx, '/users/@me', ctx.request);
}

export function _fetch<T = unknown>(
	ctx: AstroCtx,
	path: string,
	requestInit?: RequestInit,
): Promise<ApiResponse<T>> {
	console.log(`[API] Fetching ${path}`);

	const url = new URL(ctx.request.url);
	let domain = url.hostname;
	if (domain === 'localhost') {
		domain = 'localhost:8787';
	}

	return ctx.locals.runtime.env.API.fetch(`https://${domain}/api${path}`, requestInit)
		.then((res) => res.json() as Promise<ApiResponse<T>>);
}

export type ApiResponse<T = unknown> = ApiResponseSuccess<T> | ApiResponseError;

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
