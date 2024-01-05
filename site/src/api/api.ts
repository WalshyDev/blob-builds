import { ProjectList } from '../../../worker/src/store/ProjectStore';

export function getProjects(args: DataFunctionArgs) {
	return _fetch<ProjectList>(args, '/api/projects');
}

export function getAllBuildsPerProject(args: DataFunctionArgs, project: string, releaseChannel?: string) {
	if (releaseChannel) {
		return getAllBuildsPerProjectAndReleaseChannel(args, project, releaseChannel);
	}
	return _fetch<BuildList>(args, `/api/builds/${project}`);
}

export function getAllBuildsPerProjectAndReleaseChannel(
	args: DataFunctionArgs,
	project: string,
	releaseChannel: string,
) {
	return _fetch<BuildList>(args, `/api/builds/${project}/${releaseChannel}`);
}

export function _fetch<T = unknown>(args: DataFunctionArgs, path: string, init?: RequestInit): Promise<ApiResponse<T>> {
	// TODO: handle auth
	const { context, request } = args;

	console.log(`fetching ${path}`);
	return context.API.fetch(`https://api.local${path}`, {
		...init,
		headers: {
			...init?.headers,
			...Object.fromEntries(request.headers),
		},
	}).then(res => res.json());
}
