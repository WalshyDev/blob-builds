import { getUser } from '~/api/api';
import type { APIContext, AstroGlobal } from 'astro';

export async function isLoggedIn(ctx: AstroGlobal | APIContext) {
	// TODO: Move cookie name to a shared const
	const sessionCookie = ctx.cookies.get('blobbuilds_session');

	if (sessionCookie === undefined || sessionCookie.value === '') {
		return false;
	}

	const user = await getUser(ctx);
	if (user.success === false || user.data === null) {
		return false;
	}

	ctx.locals.user = user.data;

	return true;
}
