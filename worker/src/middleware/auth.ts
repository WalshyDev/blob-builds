import { Next } from 'hono';
import * as errors from	'~/api/errors';
import UserStore from '~/store/users';
import { Ctx } from '~/types/hono';
import { getStore } from '~/utils/storage';
import { trace } from '~/utils/trace';

// TODO: Support real logins
export const auth = async (ctx: Ctx, next: Next): Promise<Response | void> => {
	return trace('AuthMiddleware.auth', async () => {
		// There are 2 accepted auth methods
		// * API tokens
		// * Dashboard JWT (soontm)

		const authHeader = ctx.req.header('authorization');
		if (authHeader === undefined || !authHeader.toLowerCase().startsWith('bearer ')) {
			return errors.InvalidAuthHeader.toResponse(ctx);
		}

		const apiToken = authHeader.substring('bearer '.length);

		const user = await UserStore.getUserByApiToken(apiToken);
		if (user === null) {
			return errors.InvalidApiToken.toResponse(ctx);
		}

		ctx.set('userId', user.userId);
		ctx.set('user', user);

		getStore().sentry.setUser({ id: user.userId, ip_address: '0.0.0.0' });

		return next();
	});
};
