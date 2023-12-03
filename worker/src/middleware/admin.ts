import { Next } from 'hono';
import * as errors from	'~/api/errors';
import { Ctx } from '~/types/hono';
import { trace } from '~/utils/trace';

export const adminOnly = async (ctx: Ctx, next: Next): Promise<Response | void> => {
	return trace('AdminMiddleware.adminOnly', async () => {
		// TODO: Make a real admin implementation
		if (ctx.get('userId') === 5) {
			return next();
		} else {
			return errors.AdminOnly.toResponse(ctx);
		}
	});
};
