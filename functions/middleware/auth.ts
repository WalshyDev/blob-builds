import { getUserByApiToken } from '~/functions/store/users';
import { ErrorCode, badRequest } from '~/functions/utils/api';

// TODO: Support real logins
export const handleAuth: BlobFunction = async ({ request, env, data, next }) => {
	const authHeader = request.headers.get('authorization');
	if (authHeader === null || !authHeader.toLowerCase().startsWith('bearer ')) {
		return badRequest(ErrorCode.INVALID_AUTH_HEADER, 'Invalid Authorization header!');
	}

	const apiToken = authHeader.substring('bearer '.length);

	const user = await getUserByApiToken(env.DB, apiToken);
	if (user === null) {
		return badRequest(ErrorCode.INVALID_API_TOKEN, 'Invalid API token!');
	}

	data.userId = user.user_id;
	data.user = user;

	return next();
};
