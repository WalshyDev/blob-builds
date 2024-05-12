import { isLoggedIn } from '~/auth/auth';
import type { APIContext, MiddlewareNext } from 'astro';

export async function onRequest(ctx: APIContext, next: MiddlewareNext) {
	if (ctx.url.pathname.startsWith('/panel') && !(await isLoggedIn(ctx))) {
		return redirectToLogin(ctx);
	}

	return next();
}

function redirectToLogin(ctx: APIContext) {
	const url = new URL(ctx.request.url);
	url.pathname = '/login';
	return Response.redirect(url, 307);
}
