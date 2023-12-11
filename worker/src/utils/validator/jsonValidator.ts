import { z } from 'zod';
import * as errors from '~/api/errors';
import { Ctx } from '~/types/hono';

export type Handler<T> = (ctx: Ctx, body: T) => Response | Promise<Response>;

export default function jsonValidator<T>(schema: z.ZodType<T, z.ZodTypeDef>, controller: Handler<T>) {
	return async (ctx: Ctx) => {
		let jsonBody;
		try {
			jsonBody = await ctx.req.json();
		} catch(_) {
			return errors.InvalidJson('Json body not provided').toResponse(ctx);
		}

		const parsed = schema.safeParse(jsonBody);

		if (parsed.success === true) {
			return controller(ctx, parsed.data);
		} else {
			return errors.InvalidJson(parsed.error.errors[0].message).toResponse(ctx);
		}
	};
}
