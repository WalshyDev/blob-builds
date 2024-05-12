import { Next } from 'hono';
import * as errors from	'~/api/errors';
import { Ctx } from '~/types/hono';
import { trace } from '~/utils/trace';
import UserFlags, { hasUserFlag } from '@/flags/UserFlags';

export const adminOnly = async (ctx: Ctx, next: Next): Promise<Response | void> => {
	return trace('AdminMiddleware.adminOnly', async () => {
		const user = ctx.get('user');

		if (hasUserFlag(user.flags, UserFlags.ADMIN)) {
			return next();
		} else {
			return errors.AdminOnly.toResponse(ctx);
		}
	});
};
