import { applyD1Migrations, env, fetchMock } from 'cloudflare:test';
import { sql } from 'drizzle-orm';
import { parse } from 'hono/utils/cookie';
import { LOCAL_WORKER_URL, TestRequest } from 'tests/testutils/request';
import { createUser, init }  from 'tests/testutils/seed';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as errors from '~/api/errors';
import { AccessResponse, GitHubUser } from '~/auth/oauth/github';
import { SESSION_COOKIE_NAME } from '~/auth/session';
import { UserResponse } from '~/handlers/users/user';
import { users } from '~/store/schema';
import UserStore from '~/store/UserStore';
import Constants from '~/utils/constants';
import { getDb } from '~/utils/storage';

describe('/api/auth/oauth/github', () => {
	beforeEach(async () => {
		await applyD1Migrations(env.DB, env.MIGRATIONS);

		// Intercept fetch
		fetchMock.activate();
		fetchMock.disableNetConnect();
	});

	afterEach(() => {
		fetchMock.assertNoPendingInterceptors();
	});

	describe('/initiate', () => {
		test('Will redirect to GitHub', async () => {
			const res = await TestRequest.new('/api/auth/oauth/github/initiate', { redirect: 'manual' }).run();
			res.expectStatus(302);

			const location = res.getBody().headers.get('location');
			expect(location).not.toBeNull();

			const url = new URL(location!);
			expect(url.hostname).toBe('github.com');

			const searchParams = url.searchParams;
			expect(searchParams.get('client_id')).toBe('github-client-id');
			expect(searchParams.get('redirect_uri')).not.toBeNull();
			expect(searchParams.get('scope')).toBe('read:user,user:email');
			expect(searchParams.get('state')).not.toBeNull();
			expect(searchParams.get('state')?.length).toBe(32);

			const redirectUri = new URL(searchParams.get('redirect_uri')!);
			expect(redirectUri.pathname).toBe('/api/auth/oauth/github/callback');
		});
	});

	describe('/callback', () => {
		test('Happy path - new user', async () => {
			// Initiate the OAuth flow
			const res = await TestRequest.new('/api/auth/oauth/github/initiate', { redirect: 'manual' }).run();
			res.expectStatus(302);

			const location = res.getBody().headers.get('location');
			expect(location).not.toBeNull();

			const url = new URL(location!);
			expect(url.hostname).toBe('github.com');

			// Get the state
			const state = url.searchParams.get('state');
			expect(state).not.toBeNull();

			// Mock the GitHub calls
			const accessToken = 'ooo-access-token';
			// 1. Mock the access token call
			fetchMock.get('https://github.com')
				.intercept({
					method: 'POST',
					path: '/login/oauth/access_token',
					query: {
						client_id: 'github-client-id',
						client_secret: 'github-client-secret',
						code: 'github-code',
						redirect_uri: `${LOCAL_WORKER_URL}/api/auth/oauth/github/callback`,
					},
				})
				.reply(200, {
					access_token: accessToken,
					scope: 'read:user,user:email',
					token_type: 'bearer',
				} as AccessResponse);

			// 2. Mock the user call
			fetchMock.get('https://api.github.com')
				.intercept({
					path: '/user',
					headers: {
						Accept: 'application/vnd.github.v3+json',
						Authorization: `Bearer ${accessToken}`,
						'User-Agent': Constants.USER_AGENT,
					},
				})
				.reply(200, {
					login: 'test-gh-user',
					id: 123,
					type: 'User',
				} as GitHubUser);

			// Call the callback
			const params = new URLSearchParams();
			params.append('code', 'github-code');
			params.append('state', state!);
			const callbackRes = await TestRequest.new(`/api/auth/oauth/github/callback?${params.toString()}`,
				{ redirect: 'manual' },
			).run();
			callbackRes.expectStatus(200);
			callbackRes.expectSuccessful();
			callbackRes.expectData();

			// Verify we have a session cookie
			const sessionCookie = callbackRes.getBody().headers.get('set-cookie');
			expect(sessionCookie).not.toBeNull();
			const parsed = parse(sessionCookie!);
			expect(parsed[SESSION_COOKIE_NAME]).toBeDefined();
			expect(parsed['SameSite']).toBe('Lax'); // In tests, this will always be Lax

			const data = callbackRes.getData<UserResponse>();
			expect(data.name).toBe('test-gh-user');
			expect(data.oauthProvider).toBe('github');
			expect(data.oauthId).toBe('123');
			expect(data.apiToken).not.toBeNull();

			// Confirm user exists in the DB
			const createdUser = await init(env, () => UserStore.getUserByApiToken(data.apiToken));
			expect(createdUser).not.toBeUndefined();
			expect(createdUser!.name).toBe('test-gh-user');
			expect(createdUser!.oauthProvider).toBe('github');
			expect(createdUser!.oauthId).toBe('123');
			expect(createdUser!.apiToken).toBe(data.apiToken);
		});

		test('Happy path - existing user', async () => {
			await createUser(env, {
				name: 'test-gh-user',
				oauthProvider: 'github',
				oauthId: '123',
			});
			const result = await init(env, () => getDb().select({ count: sql<number>`COUNT(*)` }).from(users).get());
			expect(result).toBeDefined();
			expect(result?.count).toBe(1);

			// Initiate the OAuth flow
			const res = await TestRequest.new('/api/auth/oauth/github/initiate', { redirect: 'manual' }).run();
			res.expectStatus(302);

			const location = res.getBody().headers.get('location');
			expect(location).not.toBeNull();

			const url = new URL(location!);
			expect(url.hostname).toBe('github.com');

			// Get the state
			const state = url.searchParams.get('state');
			expect(state).not.toBeNull();

			// Mock the GitHub calls
			const accessToken = 'ooo-access-token';
			// 1. Mock the access token call
			fetchMock.get('https://github.com')
				.intercept({
					method: 'POST',
					path: '/login/oauth/access_token',
					query: {
						client_id: 'github-client-id',
						client_secret: 'github-client-secret',
						code: 'github-code',
						redirect_uri: `${LOCAL_WORKER_URL}/api/auth/oauth/github/callback`,
					},
				})
				.reply(200, {
					access_token: accessToken,
					scope: 'read:user,user:email',
					token_type: 'bearer',
				} as AccessResponse);

			// 2. Mock the user call
			fetchMock.get('https://api.github.com')
				.intercept({
					path: '/user',
					headers: {
						Accept: 'application/vnd.github.v3+json',
						Authorization: `Bearer ${accessToken}`,
						'User-Agent': Constants.USER_AGENT,
					},
				})
				.reply(200, {
					login: 'test-gh-user',
					id: 123,
					type: 'User',
				} as GitHubUser);

			// Call the callback
			const params = new URLSearchParams();
			params.append('code', 'github-code');
			params.append('state', state!);
			const callbackRes = await TestRequest.new(`/api/auth/oauth/github/callback?${params.toString()}`,
				{ redirect: 'manual' },
			).run();
			callbackRes.expectStatus(200);
			callbackRes.expectSuccessful();
			callbackRes.expectData();

			// Verify we have a session cookie
			const sessionCookie = callbackRes.getBody().headers.get('set-cookie');
			expect(sessionCookie).not.toBeNull();
			const parsed = parse(sessionCookie!);
			expect(parsed[SESSION_COOKIE_NAME]).toBeDefined();
			expect(parsed['SameSite']).toBe('Lax'); // In tests, this will always be Lax

			const data = callbackRes.getData<UserResponse>();
			expect(data.name).toBe('test-gh-user');
			expect(data.oauthProvider).toBe('github');
			expect(data.oauthId).toBe('123');
			expect(data.apiToken).not.toBeNull();

			// Confirm we still only have a single user
			const resultTwo = await init(env, () => getDb().select({ count: sql<number>`COUNT(*)` }).from(users).get());
			expect(resultTwo).toBeDefined();
			expect(resultTwo?.count).toBe(1);
		});

		test('No code throws error', async () => {
			// Initiate the OAuth flow
			const res = await TestRequest.new('/api/auth/oauth/github/initiate', { redirect: 'manual' }).run();
			res.expectStatus(302);

			const location = res.getBody().headers.get('location');
			expect(location).not.toBeNull();

			const url = new URL(location!);
			expect(url.hostname).toBe('github.com');

			// Get the state
			const state = url.searchParams.get('state');
			expect(state).not.toBeNull();

			// Call the callback
			const params = new URLSearchParams();
			params.append('state', state!);
			const callbackRes = await TestRequest.new(`/api/auth/oauth/github/callback?${params.toString()}`,
				{ redirect: 'manual' },
			).run();
			callbackRes.expectStatus(400);
			callbackRes.expectFailure();
			callbackRes.expectError(errors.InvalidCallback_NoCode);
		});

		test('Empty code throws error', async () => {
			// Initiate the OAuth flow
			const res = await TestRequest.new('/api/auth/oauth/github/initiate', { redirect: 'manual' }).run();
			res.expectStatus(302);

			const location = res.getBody().headers.get('location');
			expect(location).not.toBeNull();

			const url = new URL(location!);
			expect(url.hostname).toBe('github.com');

			// Get the state
			const state = url.searchParams.get('state');
			expect(state).not.toBeNull();

			// Call the callback
			const params = new URLSearchParams();
			params.append('code', '');
			params.append('state', state!);
			const callbackRes = await TestRequest.new(`/api/auth/oauth/github/callback?${params.toString()}`,
				{ redirect: 'manual' },
			).run();
			callbackRes.expectStatus(400);
			callbackRes.expectFailure();
			callbackRes.expectError(errors.InvalidCallback_NoCode);
		});

		test('No state throws error', async () => {
			// Initiate the OAuth flow
			const res = await TestRequest.new('/api/auth/oauth/github/initiate', { redirect: 'manual' }).run();
			res.expectStatus(302);

			const location = res.getBody().headers.get('location');
			expect(location).not.toBeNull();

			const url = new URL(location!);
			expect(url.hostname).toBe('github.com');

			// Get the state
			const state = url.searchParams.get('state');
			expect(state).not.toBeNull();

			// Call the callback
			const params = new URLSearchParams();
			params.append('code', 'github-code');
			const callbackRes = await TestRequest.new(`/api/auth/oauth/github/callback?${params.toString()}`,
				{ redirect: 'manual' },
			).run();
			callbackRes.expectStatus(400);
			callbackRes.expectFailure();
			callbackRes.expectError(errors.InvalidCallback_NoState);
		});

		test('Empty state throws error', async () => {
			// Initiate the OAuth flow
			const res = await TestRequest.new('/api/auth/oauth/github/initiate', { redirect: 'manual' }).run();
			res.expectStatus(302);

			const location = res.getBody().headers.get('location');
			expect(location).not.toBeNull();

			const url = new URL(location!);
			expect(url.hostname).toBe('github.com');

			// Get the state
			const state = url.searchParams.get('state');
			expect(state).not.toBeNull();

			// Call the callback
			const params = new URLSearchParams();
			params.append('code', 'github-code');
			params.append('state', '');
			const callbackRes = await TestRequest.new(`/api/auth/oauth/github/callback?${params.toString()}`,
				{ redirect: 'manual' },
			).run();
			callbackRes.expectStatus(400);
			callbackRes.expectFailure();
			callbackRes.expectError(errors.InvalidCallback_NoState);
		});

		test('GitHub error throws error on access_token request', async () => {
			// Initiate the OAuth flow
			const res = await TestRequest.new('/api/auth/oauth/github/initiate', { redirect: 'manual' }).run();
			res.expectStatus(302);

			const location = res.getBody().headers.get('location');
			expect(location).not.toBeNull();

			const url = new URL(location!);
			expect(url.hostname).toBe('github.com');

			// Get the state
			const state = url.searchParams.get('state');
			expect(state).not.toBeNull();

			// Mock the GitHub calls
			// 1. Mock the access token call
			fetchMock.get('https://github.com')
				.intercept({
					method: 'POST',
					path: '/login/oauth/access_token',
					query: {
						client_id: 'github-client-id',
						client_secret: 'github-client-secret',
						code: 'invalid-code',
						redirect_uri: `${LOCAL_WORKER_URL}/api/auth/oauth/github/callback`,
					},
				})
				.reply(400, { error: 'bad_verification_code' });

			// Call the callback
			const params = new URLSearchParams();
			params.append('code', 'invalid-code');
			params.append('state', state!);
			const callbackRes = await TestRequest.new(`/api/auth/oauth/github/callback?${params.toString()}`,
				{ redirect: 'manual' },
			).run();
			// TODO: Throw a better error
			callbackRes.expectStatus(500);
			callbackRes.expectFailure();
			callbackRes.expectError(errors.InternalError);
		});

		test('GitHub error throws error on access_token request', async () => {
			// Initiate the OAuth flow
			const res = await TestRequest.new('/api/auth/oauth/github/initiate', { redirect: 'manual' }).run();
			res.expectStatus(302);

			const location = res.getBody().headers.get('location');
			expect(location).not.toBeNull();

			const url = new URL(location!);
			expect(url.hostname).toBe('github.com');

			// Get the state
			const state = url.searchParams.get('state');
			expect(state).not.toBeNull();

			// Mock the GitHub calls
			const accessToken = 'ooo-access-token';
			// 1. Mock the access token call
			fetchMock.get('https://github.com')
				.intercept({
					method: 'POST',
					path: '/login/oauth/access_token',
					query: {
						client_id: 'github-client-id',
						client_secret: 'github-client-secret',
						code: 'github-code',
						redirect_uri: `${LOCAL_WORKER_URL}/api/auth/oauth/github/callback`,
					},
				})
				.reply(200, {
					access_token: accessToken,
					scope: 'read:user,user:email',
					token_type: 'bearer',
				} as AccessResponse);

			// 2. Mock the user call
			fetchMock.get('https://api.github.com')
				.intercept({
					path: '/user',
					headers: {
						Accept: 'application/vnd.github.v3+json',
						Authorization: `Bearer ${accessToken}`,
						'User-Agent': Constants.USER_AGENT,
					},
				})
				.reply(401, { error: 'unathorized' });

			// Call the callback
			const params = new URLSearchParams();
			params.append('code', 'github-code');
			params.append('state', state!);
			const callbackRes = await TestRequest.new(`/api/auth/oauth/github/callback?${params.toString()}`,
				{ redirect: 'manual' },
			).run();
			// TODO: Throw a better error
			callbackRes.expectStatus(500);
			callbackRes.expectFailure();
			callbackRes.expectError(errors.InternalError);
		});
	});
});
