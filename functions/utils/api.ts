export const ErrorCode = Object.freeze({
	INTERNAL_ERROR: 0,

	// Input errors
	MISSING_FIELD: 1000,
	INVALID_TYPE: 1001,
	INVALID_JSON: 1002,
	INVALID_CHECKSUM: 1003,

	// Auth errors
	INVALID_AUTH_HEADER: 2000,
	INVALID_API_TOKEN: 2001,

	// User errors

	// Project errors
	PROJECT_NOT_FOUND: 4000,
	PROJECT_ALREADY_EXISTS: 4001,

	// Release channel errors
	RELEASE_CHANNEL_NOT_FOUND: 5000,

	// Build errors
	BUILD_NOT_FOUND: 6000,
});

export function ok(message: string, data?: object) {
	return json({ success: true, message, data }, 200);
}

export function badRequest(erroCode: number, error: string): Response {
	return json({ success: false, code: erroCode, error }, 400);
}

export function notFound(erroCode: number, error: string): Response {
	return json({ success: false, code: erroCode, error }, 404);
}

function json(obj: object, statusCode: number): Response {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return Response.json(obj, { status: statusCode });
}
