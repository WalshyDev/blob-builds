import { SELF } from 'cloudflare:test';
import { expect } from 'vitest';
import { ApiError } from '~/api/ApiError';

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
		let body = undefined;
		if (res.body !== null) {
			body = await res.json<ApiResponse>();
		}
		return TestResponse.new(res, body);
	}
}

export class TestResponse {

	#res: Response;
	#body?: ApiResponse;

	constructor(res: Response, body?: ApiResponse) {
		this.#res = res;
		this.#body = body;
	}

	static new(res: Response, body?: ApiResponse) {
		return new TestResponse(res, body);
	}

	getBody() {
		return this.#body;
	}

	getData<T>(): T {
		if (this.#body === undefined) {
			expect(this.#body).not.toBeUndefined();
			throw new Error('Body is undefined');
		}
		if (this.#body.success === false) {
			expect(this.#body.success).toBe(true);
			throw new Error('Request was not successful');
		}
		if (this.#body.data === undefined || this.#body.data === null) {
			expect(this.#body.data).not.toBeUndefined();
			expect(this.#body.data).not.toBeNull();
			throw new Error('Data is undefined or null');
		}

		return this.#body.data as T;
	}

	// Expectations
	expectStatus(status: number) {
		expect(this.#res.status).toBe(status);
	}

	expectSuccessful() {
		expect(this.#body!.success).toBe(true);
		expect(this.#body).not.toBeUndefined();
	}

	expectFailure() {
		expect(this.#body).not.toBeUndefined();
		expect(this.#body!.success).toBe(false);
	}

	expectData() {
		if (this.#body === undefined) {
			expect(this.#body).not.toBeUndefined();
			throw new Error('Body is undefined');
		}
		if (this.#body.success === false) {
			expect(this.#body.success).toBe(true);
			throw new Error('Request was not successful');
		}
		expect(this.#body!.data).not.toBeNull();
	}

	expectError(error: ApiError) {
		if (this.#body === undefined) {
			expect(this.#body).not.toBeUndefined();
			throw new Error('Body is undefined');
		}
		if (this.#body.success === true) {
			expect(this.#body.success).toBe(false);
			throw new Error('Request was successful');
		}
		expect(this.#res.status).toBe(error.getStatusCode());
		expect(this.#body!.code).toBe(error.getCode());
		expect(this.#body!.error).toBe(error.getErrorMessage());
	}
}
