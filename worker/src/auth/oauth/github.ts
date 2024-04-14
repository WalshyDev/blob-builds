import OAuthStateStore from '~/store/OAuthStateStore';
import { Ctx } from '~/types/hono';
import Constants from '~/utils/constants';

const BASE_URL = 'https://github.com';
const REDIRECT_PATH = '/api/auth/oauth/github/callback';

export async function getAuthorizeUrl(ctx: Ctx) {
	// Point the current hostname to the callback url
	const redirectUrl = new URL(ctx.req.url);
	redirectUrl.pathname = REDIRECT_PATH;

	const state = await OAuthStateStore.createState();

	return `${BASE_URL}/login/oauth/authorize`
		+ `?client_id=${ctx.env.GITHUB_CLIENT_ID}`
		+ `&redirect_uri=${redirectUrl.toString()}`
		+ '&scope=read:user,user:email'
		+ `&state=${state}`;
}

export interface AccessResponse {
	access_token: string;
	scope: string;
	token_type: string;
}

export async function getAccessToken(ctx: Ctx, code: string): Promise<AccessResponse | null> {
	const redirectUri = new URL(ctx.req.url);
	redirectUri.pathname = REDIRECT_PATH;
	redirectUri.search = '';

	const res = await fetch(
		`${BASE_URL}/login/oauth/access_token`
			+ `?client_id=${ctx.env.GITHUB_CLIENT_ID}`
			+ `&client_secret=${ctx.env.GITHUB_CLIENT_SECRET}`
			+ `&code=${code}`
			+ `&redirect_uri=${redirectUri}`,
		{
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'User-Agent': Constants.USER_AGENT,
			},
		},
	);

	if (res.ok) {
		return res.json<AccessResponse>();
	}

	ctx.get('sentry').addBreadcrumb({
		message: 'GitHub returned non-ok status code getting access token',
		category: 'auth',
		data: {
			status: res.status,
			githubResponse: await res.text(),
		},
	});

	return null;
}

export interface GitHubUser {
	login: string;
	id: number;
	type: 'User';
}

export async function getUser(ctx: Ctx, accessToken: string): Promise<GitHubUser | null> {
	const res = await fetch('https://api.github.com/user', {
		headers: {
			'Accept': 'application/vnd.github.v3+json',
			'Authorization': `Bearer ${accessToken}`,
			'User-Agent': Constants.USER_AGENT,
		},
	});

	if (res.ok) {
		return res.json<GitHubUser>();
	}

	ctx.get('sentry').addBreadcrumb({
		message: 'GitHub returned non-ok status code getting user',
		category: 'auth',
		data: {
			status: res.status,
			githubResponse: await res.text(),
		},
	});

	return null;
}
