import { ProjectList } from 'worker/src/store/ProjectStore';

export function getProjects(env: Env) {
	return _fetch<ProjectList>(env, '/api/projects');
}

export function getAllBuildsPerProject(env: Env, project: string) {
	return _fetch<ProjectList>(env, `/api/builds/${project}`);
}

export function _fetch<T = unknown>(env: Env, path: string, init?: RequestInit): Promise<ApiResponse<T>> {
	// TODO: handle auth

	return env.API.fetch(`https://api.local${path}`, init).then(res => res.json());
}
