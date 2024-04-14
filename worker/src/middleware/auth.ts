import { Next } from 'hono';
import * as errors from	'~/api/errors';
import { fromSessionId, getSessionId } from '~/auth/session';
import { User } from '~/store/schema';
import UserStore from '~/store/UserStore';
import { Ctx } from '~/types/hono';
import { getStore } from '~/utils/storage';
import { trace } from '~/utils/trace';

export const auth = async (ctx: Ctx, next: Next): Promise<Response | void> => {
	return trace('AuthMiddleware.auth', async () => {
		// There are 2 accepted auth methods
		// * API tokens
		// * Session IDs

		let user: User | undefined;

		// Attempt to get the user from the API token
		const authHeader = ctx.req.header('authorization');
		if (authHeader !== undefined) {
			if (!authHeader.toLowerCase().startsWith('bearer ')) {
				return errors.InvalidAuthHeader.toResponse(ctx);
			}

			const apiToken = authHeader.substring('bearer '.length);

			user = await UserStore.getUserByApiToken(apiToken);
			if (user === undefined) {
				return errors.InvalidApiToken.toResponse(ctx);
			}
		}

		// Attempt to get the user from the session
		const sessionId = getSessionId(ctx);
		if (sessionId !== undefined) {
			user = await fromSessionId(sessionId);
			if (user === undefined) {
				return errors.InvalidSessionId.toResponse(ctx);
			}
		}

		// No valid auth methods
		if (user === undefined) {
			return errors.NoAuthentication.toResponse(ctx);
		}

		ctx.set('userId', user.userId);
		ctx.set('user', user);

		getStore().sentry.setUser({ id: user.userId, ip_address: '0.0.0.0' });

		return next();
	});
};
