import { getCookie } from 'hono/cookie';
import { CookieOptions, serialize } from 'hono/utils/cookie';
import { User } from '~/store/schema';
import SessionStore from '~/store/SessionStore';
import UserStore from '~/store/UserStore';
import { Ctx } from '~/types/hono';
import { isDevTest } from '~/utils/utils';

export const SESSION_COOKIE_NAME = 'blobbuilds_session';

interface Session {
	sessionId: string;
	sessionCookie: string;
}

export async function newSession(ctx: Ctx, user: User): Promise<Session> {
	const sessionId = await SessionStore.createSession(user.userId);

	const domain = new URL(ctx.req.url).hostname;

	let cookieOptions: CookieOptions;
	if (isDevTest(ctx)) {
		cookieOptions = {
			secure: false,
			httpOnly: true,
			sameSite: 'Lax',
		};
	} else {
		cookieOptions = {
			domain,
			secure: true,
			httpOnly: true,
			sameSite: 'Strict',
		};
	}

	const cookie = serialize(SESSION_COOKIE_NAME, sessionId, cookieOptions);

	return {
		sessionId,
		sessionCookie: cookie,
	};
}

export function getSessionId(ctx: Ctx): string | undefined {
	return getCookie(ctx, SESSION_COOKIE_NAME);
}

// TODO: Move this to a single query
export async function fromSessionId(sessionId: string): Promise<User | undefined> {
	const result = await SessionStore.getUserIdBySessionId(sessionId);
	if (result === undefined) {
		return undefined;
	}

	return UserStore.getUserById(result.userId);
}
