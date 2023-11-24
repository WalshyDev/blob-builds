import { ProjectList } from 'worker/src/store/projects';

export function getProjects(env: Env) {
	return _fetch<ProjectList>(env, '/api/projects');
}

export function _fetch<T = unknown>(env: Env, path: string, init?: RequestInit): Promise<ApiResponse<T>> {
	// TODO: handle auth

	return env.API.fetch(`https://api.local${path}`, init).then(res => res.json());
}
