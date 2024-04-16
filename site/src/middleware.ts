import { isLoggedIn } from '~/auth/auth';
import type { APIContext, MiddlewareNext } from 'astro';

export function onRequest (ctx: APIContext, next: MiddlewareNext) {
	if (ctx.url.pathname.startsWith('/panel') && !isLoggedIn(ctx)) {
		// TODO; redirect
		return new Response('Not authorized', { status: 401 });
	}

	return next();
}
