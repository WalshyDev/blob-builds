import { Ctx } from '~/types/hono';

export function isDevTest(ctx: Ctx) {
	return ctx.env.ENVIRONMENT === 'dev' || ctx.env.ENVIRONMENT === 'test';
}
