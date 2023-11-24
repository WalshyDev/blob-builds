export function success<T = unknown>(message: string, data: T | null = null) {
	return res({
		success: true,
		message,
		data,
	});
}

export function error(code: number, error: string, stack?: string) {
	return res({
		success: false,
		code,
		error,
		stack,
	});
}

export function res<T>(res: ApiResponse<T>, statusCode = 200) {
	return Response.json(res, { status: statusCode });
}
