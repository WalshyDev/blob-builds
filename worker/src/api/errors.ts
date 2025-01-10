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

export const AdminOnly = new ApiError({
	code: 2,
	errorMessage: 'Admin only!',
	statusCode: StatusCode.FORBIDDEN,
});

export const InvalidTimeWindow = new ApiError({
	code: 3,
	errorMessage: 'Invalid time window',
	statusCode: StatusCode.BAD_REQUEST,
});

// Input errors
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

export const NothingToUpdate = new ApiError({
	code: 1005,
	errorMessage: 'Nothing to update',
	statusCode: StatusCode.BAD_REQUEST,
});

// Auth
export const InvalidAuthHeader = new ApiError({
	code: 2000,
	errorMessage: 'Invalid authorization header',
	statusCode: StatusCode.UNAUTHORIZED,
});

export const InvalidApiToken = new ApiError({
	code: 2001,
	errorMessage: 'Invalid API token',
	statusCode: StatusCode.UNAUTHORIZED,
});

export const InvalidSessionId = new ApiError({
	code: 2002,
	errorMessage: 'Invalid session ID',
	statusCode: StatusCode.UNAUTHORIZED,
});

export const NoAuthentication = new ApiError({
	code: 2003,
	errorMessage: 'No authentication provided',
	statusCode: StatusCode.UNAUTHORIZED,
});

export const InvalidCallback_NoCode = new ApiError({
	code: 2100,
	errorMessage: 'Invalid callback: No code',
	statusCode: StatusCode.BAD_REQUEST,
});

export const InvalidCallback_NoState = new ApiError({
	code: 2101,
	errorMessage: 'Invalid callback: No state',
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

export const NoReleaseChannels = new ApiError({
	code: 5001,
	errorMessage: 'No release channels specified',
	statusCode: StatusCode.BAD_REQUEST,
});

export const ReleaseChannelAlreadyExists = new ApiError({
	code: 5002,
	errorMessage: 'A release channel with that name already exists',
	statusCode: StatusCode.BAD_REQUEST,
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
