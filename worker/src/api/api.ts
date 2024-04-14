export function success<T = unknown>(message: string, data: T | null = null, pagination?: Pagination) {
	return res({
		success: true,
		message,
		data,
		pagination,
	});
}

export function res<T>(res: ApiResponse<T>, statusCode = 200) {
	return Response.json(res, { status: statusCode });
}
