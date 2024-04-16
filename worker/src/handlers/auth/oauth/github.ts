import * as errors from '~/api/errors';
import { getAccessToken, getAuthorizeUrl, getUser } from '~/auth/oauth/github';
import { newSession } from '~/auth/session';
import UserStore from '~/store/UserStore';
import { Ctx } from '~/types/hono';

export async function githubInitiate(ctx: Ctx) {
	return ctx.redirect(await getAuthorizeUrl(ctx));
}

export async function githubCallback(ctx: Ctx) {
	const url = new URL(ctx.req.url);

	const code = url.searchParams.get('code');
	if (code === null || code.length === 0) {
		return errors.InvalidCallback_NoCode.toResponse(ctx);
	}

	const state = url.searchParams.get('state');
	if (state === null || state.length === 0) {
		return errors.InvalidCallback_NoState.toResponse(ctx);
	}

	const accessToken = await getAccessToken(ctx, code);
	if (accessToken === null) {
		return errors.InternalError.toResponse(ctx);
	}

	const ghUser = await getUser(ctx, accessToken.access_token);
	if (ghUser === null || ghUser.type !== 'User') {
		return errors.InternalError.toResponse(ctx);
	}

	let user = await UserStore.getUserByOAuthId('github', ghUser.id);
	if (user === undefined) {
		user = await UserStore.createNewUserFromOAuth('github', ghUser.id, ghUser.login);
	}

	// Create user
	const { sessionCookie } = await newSession(ctx, user);
	return new Response(null, {
		status: 302,
		headers: {
			Location: '/panel/',
			'Set-Cookie': sessionCookie,
		},
	});
}
