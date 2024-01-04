import { drizzle } from 'drizzle-orm/d1';
import { Next } from 'hono';
import { Toucan } from 'toucan-js';
import { Analytics } from '~/analytics/analytics';
import * as schema from '~/store/schema';
import { Ctx } from '~/types/hono';
import { Store, getStore, storage } from '~/utils/storage';
import { isDevTest } from '~/utils/utils';

export async function setup(ctx: Ctx, next: Next): Promise<Response | void> {
	// Set env
	const env = ctx.env.ENVIRONMENT;
	ctx.set('env', env);
	const start = Date.now();
	ctx.set('requestStartTime', start);

	// Setup Sentry
	const sentry = new Toucan({
		dsn: ctx.env.SENTRY_DSN,
		environment: env,

		context: ctx.executionCtx,
		request: ctx.req.raw,
	});

	// We do not want to log PII!
	sentry.setUser({ ip_address: '0.0.0.0' });
	ctx.set('sentry', sentry);

	// Setup analytics
	const analytics = new Analytics();
	analytics.set({
		url: ctx.req.url,
		method: ctx.req.method,
		userAgent: ctx.req.headers.get('user-agent') || '<not-set>',
	});

	const db = drizzle(ctx.env.DB, { schema, logger: isDevTest(ctx) });

	// Setup storage
	const store: Store = { env: ctx.env, sentry, analytics, db };

	return storage.run(store, () => next());
}

export async function writeAnalytics(ctx: Ctx, next: Next): Promise<Response | void> {
	// We want to run after everything
	await next();

	const { projectName, releaseChannel } = ctx.req.param();

	const analytics = getStore().analytics;

	analytics.set({
		path: ctx.req.routePath === '/*' ? ctx.req.path : ctx.req.routePath,
		project: projectName,
		releaseChannel,

		statusCode: ctx.res.status,
		responseTime: Date.now() - ctx.get('requestStartTime'),
	});
	analytics.write(ctx.env);
}
