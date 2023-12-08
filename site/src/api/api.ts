import { ProjectList } from '../../../worker/src/store/ProjectStore';

export function getProjects(env: Env) {
	return _fetch<ProjectList>(env, '/api/projects');
}

export function getAllBuildsPerProject(env: Env, project: string, releaseChannel?: string) {
	if (releaseChannel) {
		return getAllBuildsPerProjectAndReleaseChannel(env, project, releaseChannel);
	}
	return _fetch<BuildList>(env, `/api/builds/${project}`);
}

export function getAllBuildsPerProjectAndReleaseChannel(env: Env, project: string, releaseChannel: string) {
	return _fetch<BuildList>(env, `/api/builds/${project}/${releaseChannel}`);
}

export function _fetch<T = unknown>(env: Env, path: string, init?: RequestInit): Promise<ApiResponse<T>> {
	// TODO: handle auth

	console.log(`fetching ${path}`);
	return env.API.fetch(`https://api.local${path}`, init).then(res => res.json());
}
