import OAuthStateStore from '~/store/OAuthStateStore';
import { Ctx } from '~/types/hono';
import Constants from '~/utils/constants';

const BASE_URL = 'https://github.com';
const REDIRECT_PATH = '/api/auth/oauth/github/callback';

interface GitHubError {
	error: string;
	error_description: string;
	error_uri: string;
}

export async function getAuthorizeUrl(ctx: Ctx) {
	// Point the current hostname to the callback url
	const redirectUri = getRedirectUrl(ctx);

	const state = await OAuthStateStore.createState();

	return `${BASE_URL}/login/oauth/authorize`
		+ `?client_id=${ctx.env.GITHUB_CLIENT_ID}`
		+ `&redirect_uri=${redirectUri.toString()}`
		+ '&scope=read:user,user:email'
		+ `&state=${state}`;
}

export interface AccessResponse {
	access_token: string;
	scope: string;
	token_type: string;
}

export async function getAccessToken(ctx: Ctx, code: string): Promise<AccessResponse | null> {
	const redirectUri = getRedirectUrl(ctx);

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

	let body;
	try {
		body = await res.json<AccessResponse | GitHubError>();
	} catch(e) {
		ctx.get('sentry').addBreadcrumb({
			message: 'GitHub returned non-json response getting access token',
			category: 'auth',
			data: {
				status: res.status,
			},
		});

		return null;
	}

	if ((body as AccessResponse).access_token) {
		return body as AccessResponse;
	}

	if ((body as GitHubError).error) {
		const error = body as GitHubError;
		// TODO: Return proper errors
		console.error(`Got error: ${error.error} - ${error.error_description}`);
	}

	ctx.get('sentry').addBreadcrumb({
		message: 'GitHub returned non-ok status code getting access token',
		category: 'auth',
		data: {
			status: res.status,
			githubResponse: body,
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

function getRedirectUrl(ctx: Ctx): URL {
	const redirectUri = new URL(ctx.req.url);
	redirectUri.pathname = REDIRECT_PATH;
	redirectUri.search = '';

	// Wrangler seems to be setting the local hostname to my route hostname...
	// We don't want that as I want github to redirect back to local
	// So override it
	if (ctx.env.LOCAL && redirectUri.hostname === 'staging.blob.build') {
		redirectUri.hostname = 'localhost';
		redirectUri.port = '4321';
	}

	return redirectUri;
}
