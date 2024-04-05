import { SELF } from 'cloudflare:test';
import { Authn, SeededJar } from 'tests/testutils/seed';
import { expect } from 'vitest';
import { ApiError } from '~/api/ApiError';
import { Project } from '~/store/schema';
import { UploadMetadata } from '~/utils/validator/uploadValidator';

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

	async run() {
		const res = await SELF.fetch(`https://worker.local${this.#path}`, this.#init);
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
