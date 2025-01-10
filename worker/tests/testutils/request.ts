import { SELF } from 'cloudflare:test';
import { Authn, SeededJar } from 'tests/testutils/seed';
import { expect } from 'vitest';
import { ApiError } from '~/api/ApiError';
import { SESSION_COOKIE_NAME } from '~/auth/session';
import {
	NewProjectBody,
	PatchProjectBody,
	PatchProjectReleaseChannelBody,
	PostProjectReleaseChannelBody,
	ProjectSettingsBody,
} from '~/handlers/projects/project';
import { Project } from '~/store/schema';
import { UploadMetadata } from '~/utils/validator/uploadValidator';

export const LOCAL_WORKER_URL = 'https://worker.local';

export class TestRequest {

	#path: string;
	#init: RequestInit;

	constructor(path: string, init: RequestInit = {}) {
		this.#path = path;
		this.#init = init;
	}

	static new(path: string, init: RequestInit = {}) {
		return new TestRequest(path, init);
	}

	// Helpers
	// TODO: Switch to session by default
	withAuth(authn: Authn, type: 'session' | 'apiToken' = 'apiToken'): TestRequest {
		if (type === 'session') {
			this.#init.headers = {
				...this.#init.headers,
				Cookie: `${SESSION_COOKIE_NAME}=${authn.sessionId}`,
			};
		} else {
			this.#init.headers = {
				...this.#init.headers,
				Authorization: `Bearer ${authn.apiToken}`,
			};
		}
		return this;
	}

	withJson(body: object): TestRequest {
		this.#init.headers = {
			...this.#init.headers,
			'Content-Type': 'application/json',
		};
		this.#init.body = JSON.stringify(body);
		return this;
	}

	async run(): Promise<TestResponse> {
		const res = await SELF.fetch(`${LOCAL_WORKER_URL}${this.#path}`, this.#init);
		// I quite hate this but it's hard mixing types ok :(
		let apiResponse: ApiResponse | undefined = undefined;
		if (res.headers.get('content-type')?.includes('application/json')) {
			apiResponse = await res.json<ApiResponse>();
		}

		return TestResponse.new(res, apiResponse);
	}
}

export class TestResponse {

	#res: Response;
	#streamBody: ReadableStream<Uint8Array> | null;
	#apiResponse: ApiResponse | undefined = undefined;

	constructor(res: Response, apiResponse: ApiResponse | undefined = undefined) {
		this.#res = res;
		this.#streamBody = res.body;
		this.#apiResponse = apiResponse;
	}

	static new(res: Response, apiResponse: ApiResponse | undefined = undefined) {
		return new TestResponse(res, apiResponse);
	}

	getBody() {
		return this.#res;
	}

	getApiResponse() {
		return this.#apiResponse;
	}

	getData<T>(): T {
		if (this.#streamBody === undefined) {
			expect(this.#streamBody).not.toBeUndefined();
			throw new Error('Body is undefined');
		}
		const body = this.getApiResponse();
		if (body === undefined) {
			expect(body).not.toBeUndefined();
			throw new Error('API Response is undefined');
		}
		if (body.success === false) {
			expect(body.success).toBe(true);
			throw new Error('Request was not successful');
		}
		if (body.data === undefined || body.data === null) {
			expect(body.data).not.toBeUndefined();
			expect(body.data).not.toBeNull();
			throw new Error('Data is undefined or null');
		}

		return body.data as T;
	}

	// Expectations
	expectStatus(status: number) {
		expect(this.#res.status).toBe(status);
	}

	expectHeader(name: string, value: string) {
		expect(this.#res.headers.get(name)).toBe(value);
	}

	expectSuccessful() {
		const body = this.getApiResponse();
		expect(body).not.toBeUndefined();
		expect(body!.success).toBe(true);
	}

	expectFailure() {
		const body = this.getApiResponse();
		expect(body).not.toBeUndefined();
		expect(body!.success).toBe(false);
	}

	expectData() {
		const body = this.getApiResponse();
		if (body === undefined) {
			expect(body).not.toBeUndefined();
			throw new Error('Body is undefined');
		}
		if (body.success === false) {
			expect(body.success).toBe(true);
			throw new Error('Request was not successful');
		}
		expect(body!.data).not.toBeNull();
	}

	expectError(error: ApiError) {
		const body = this.getApiResponse();
		if (body === undefined) {
			expect(body).not.toBeUndefined();
			throw new Error('Body is undefined');
		}
		if (body.success === true) {
			expect(body.success).toBe(false);
			throw new Error('Request was successful');
		}
		expect(this.#res.status).toBe(error.getStatusCode());
		expect(body!.code).toBe(error.getCode());
		expect(body!.error).toBe(error.getErrorMessage());
	}
}

export function createGetUserRequest(auth: Authn) {
	return TestRequest.new('/api/users/@me')
		.withAuth(auth);
}

export function createGetProjectsRequest(projectName: string) {
	return TestRequest.new(`/api/projects/${projectName}`);
}

export function createUploadRequest(
	auth: Authn,
	project: Project,
	releaseChannelName: string, // TODO: Dislike this, make it an object somehow
	jar: SeededJar,
	metadata?: UploadMetadata,
) {
	const formData = new FormData();
	formData.append('file', jar.blob, jar.name);
	formData.append('metadata', JSON.stringify({
		checksum: metadata?.checksum ?? jar.hash,
		...metadata,
	} as UploadMetadata));

	return TestRequest.new(`/api/builds/${project.name}/${releaseChannelName}/upload`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${auth.apiToken}`,
		},
		body: formData,
	});
}

export function createDownloadRequest(project: Project, releaseChannelName: string, version?: string) {
	let path = `/dl/${project.name}/${releaseChannelName}/latest`;
	if (version !== undefined) {
		path = `/dl/${project.name}/${releaseChannelName}/${version}`;
	}
	return TestRequest.new(path);
}

export function createUpdateProjectRequest(auth: Authn, project: Project, body: PatchProjectBody) {
	return TestRequest.new(`/api/projects/${project.name}`, { method: 'PATCH' })
		.withAuth(auth)
		.withJson(body);
}

export function createNewProjectRequest(auth: Authn, body: NewProjectBody) {
	return TestRequest.new(`/api/projects/${body.name}/new`, { method: 'POST' })
		.withAuth(auth)
		.withJson(body);
}

export function createUpdateProjectSettingsRequest(auth: Authn, project: Project, body: ProjectSettingsBody) {
	return TestRequest.new(`/api/projects/${project.name}/settings`, { method: 'PATCH' })
		.withAuth(auth)
		.withJson(body);
}

export function createUpdateProjectRcRequest(
	auth: Authn,
	project: Project,
	releaseChannelName: string,
	body: PatchProjectReleaseChannelBody,
) {
	return TestRequest.new(`/api/projects/${project.name}/${releaseChannelName}`, { method: 'PATCH' })
		.withAuth(auth)
		.withJson(body);
}

export function createNewProjectRcRequest(auth: Authn, project: Project, body: PostProjectReleaseChannelBody) {
	return TestRequest.new(`/api/projects/${project.name}/release-channels`, { method: 'POST' })
		.withAuth(auth)
		.withJson(body);
}
