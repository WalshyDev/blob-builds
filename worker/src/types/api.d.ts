type ApiResponse<T = unknown> = ApiResponseSuccess<T> | ApiResponseError;

interface ApiResponseError {
	success: false;
	code: number;
	error: string;
	stack?: string;
}

interface ApiResponseSuccess<T = unknown> {
	success: true;
	message: string;
	data: T | null;
	pagination?: Pagination;
}

interface Pagination {
	page: number;
	perPage: number;
	total: number;
}
