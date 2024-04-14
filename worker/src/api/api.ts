export function success<T = unknown>(
	message: string,
	data: T | null = null,
	pagination?: Pagination,
	resInit?: ResponseInit,
) {
	return res({
		success: true,
		message,
		data,
		pagination,
	}, 200, resInit);
}

export function res<T>(res: ApiResponse<T>, statusCode = 200, resInit?: ResponseInit) {
	return Response.json(res, {
		status: statusCode,
		...resInit,
	});
}
