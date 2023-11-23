// import { getStore } from '~/utils/storage';
// import { isDevTest } from '~/utils/utils';

import StatusCode from '~/api/StatusCode';
import { Ctx } from '~/types/hono';

export class ApiError {

	#statusCode: StatusCode;
	#code: number;
	#errorMessage: string;

	// Sentry specific
	#message?: string;
	#jsError?: Error;
	#extra?: Record<string, unknown>;

	constructor({ statusCode, code, errorMessage }: { statusCode: StatusCode, code: number, errorMessage: string }) {
		this.#statusCode = statusCode;
		this.#code = code;
		this.#errorMessage = errorMessage;

		// Internal error, we're gonna log to Sentry
		if (statusCode >= 500) {
			this.#message = errorMessage;
			this.#jsError = new Error(this.#message);
		}
	}

	getJson(): ApiResponse<unknown> {
		return { success: false, code: this.#code, error: this.#errorMessage };
	}

	toResponse(ctx: Ctx): Response {
		const json = this.getJson();

		// if (isDevTest(ctx)) {
		// 	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// 	// @ts-ignore
		// 	json.stack = this.#jsError?.stack?.split('\n');
		// 	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// 	// @ts-ignore
		// 	json.extra = this.#extra;
		// }

		// Log to Sentry
		if (this.#jsError) {
			console.error(this.#jsError);
			// if (!isDevTest(ctx)) {
			// 	try {
			// 		this.sendSentryEvent();
			// 	} catch(e) {
			// 		console.error('Failed to send to Sentry: ', e);
			// 	}
			// }
		}

		return ctx.json(json, this.#statusCode);
	}

	// Getters
	getStatusCode() {
		return this.#statusCode;
	}

	getCode() {
		return this.#code;
	}

	getErrorMessage() {
		return this.#errorMessage;
	}

	// Helpers for logging to Sentry
	withMessage(message: string): ApiError {
		this.#message = message;
		this.#jsError = new Error(this.#message);
		return this;
	}

	withError(err: Error): ApiError {
		this.#jsError = err;
		return this;
	}

	withExtra(extra: Record<string, unknown>): ApiError {
		this.#extra = extra;
		return this;
	}

	sendSentryEvent() {
		// const store = getStore();

		// store.sentry.setExtras(this.#extra ?? {});
		// if (this.#jsError) {
		// 	store.sentry.captureException(this.#jsError);
		// } else {
		// 	store.sentry.captureMessage(this.#errorMessage);
		// }
	}
}
