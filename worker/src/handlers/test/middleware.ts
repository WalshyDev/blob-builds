import { Next } from 'hono';
import * as errors from '~/api/errors';
import { Ctx } from '~/types/hono';

export async function testOnlyMiddleware(ctx: Ctx, next: Next): Promise<Response | void> {
	if (ctx.env.ENVIRONMENT !== 'test') {
		return errors.RouteNotFound.toResponse(ctx as Ctx);
	}
	return next();
}
