import { Next } from 'hono';
import { Toucan } from 'toucan-js';
import { Ctx } from '~/types/hono';
import { Store, storage } from '~/utils/storage';

export async function setup(ctx: Ctx, next: Next): Promise<Response | void> {
	// Set env
	const env = ctx.env.ENVIRONMENT;
	ctx.set('env', env);

	// Setup Sentry
	const sentry = new Toucan({
		dsn: ctx.env.SENTRY_DSN,
		environment: env,

		context: ctx.executionCtx,
		request: ctx.req.raw,
	});
	// We do not want to log PII! This would break GDPR and just be shitty.
	sentry.setUser({ ip_address: '0.0.0.0' });
	ctx.set('sentry', sentry);

	// Setup storage
	const store: Store = { env: ctx.env, sentry };

	return storage.run(store, () => next());
}
