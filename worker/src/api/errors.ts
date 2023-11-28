import { ApiError } from '~/api/ApiError';
import StatusCode from '~/api/StatusCode';

// General
export const InternalError = new ApiError({
	code: 0,
	errorMessage: 'Internal server error occurred!',
	statusCode: StatusCode.INTERNAL_SERVER_ERROR,
});

export const RouteNotFound = new ApiError({
	code: 1,
	errorMessage: 'Route not found!',
	statusCode: StatusCode.NOT_FOUND,
});

// Input errors
/**
INVALID_TYPE: 1001,
INVALID_CHECKSUM: 1003,
 */
export function MissingField(field: string) {
	return new ApiError({
		code: 1000,
		errorMessage: `Missing field: ${field}`,
		statusCode: StatusCode.BAD_REQUEST,
	});
}

export function InvalidJson(errorMessage: string) {
	return new ApiError({
		code: 1002,
		errorMessage,
		statusCode: StatusCode.BAD_REQUEST,
	});
}

export function InvalidUpload(errorMessage: string) {
	return new ApiError({
		code: 1004,
		errorMessage,
		statusCode: StatusCode.BAD_REQUEST,
	});
}

// Auth
export const InvalidAuthHeader = new ApiError({
	code: 2000,
	errorMessage: 'Invalid authorization header',
	statusCode: StatusCode.BAD_REQUEST,
});

export const InvalidApiToken = new ApiError({
	code: 2001,
	errorMessage: 'Invalid API token',
	statusCode: StatusCode.BAD_REQUEST,
});

// Project
export const ProjectNotFound = new ApiError({
	code: 4000,
	errorMessage: 'Project not found',
	statusCode: StatusCode.NOT_FOUND,
});

export const ProjectAlreadyExists = new ApiError({
	code: 4001,
	errorMessage: 'A project with that name already exists',
	statusCode: StatusCode.BAD_REQUEST,
});

// Release channel errors
export const ReleaseChannelNotFound = new ApiError({
	code: 5000,
	errorMessage: 'Release channel not found',
	statusCode: StatusCode.NOT_FOUND,
});

// Build errors
export const BuildNotFound = new ApiError({
	code: 6000,
	errorMessage: 'Build not found',
	statusCode: StatusCode.NOT_FOUND,
});

export const InvalidBuildId = new ApiError({
	code: 6001,
	errorMessage: 'Invalid build ID',
	statusCode: StatusCode.BAD_REQUEST,
});
