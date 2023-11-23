type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

interface ApiResponseSuccess<T> {
	success: true;
	message: string;
	data: T | null;
}

interface ApiResponseError {
	success: false;
	code: number;
	error: string;
	stack?: string;
}
