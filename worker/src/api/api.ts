import { Pagination } from '~/utils/pagination';

export function success<T = unknown>(message: string, data: T | null = null, pagination?: Pagination) {
	return res({
		success: true,
		message,
		data,
		pagination,
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
