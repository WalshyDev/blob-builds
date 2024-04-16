import type { APIContext, AstroGlobal } from 'astro';

export function isLoggedIn(astro: AstroGlobal | APIContext) {
	// TODO: Move cookie name to a shared const
	const sessionCookie = astro.cookies.get('blobbuilds_session');
	return sessionCookie !== undefined && sessionCookie.value !== '';
}
