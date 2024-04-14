import { applyD1Migrations, env } from 'cloudflare:test';
import { TestRequest } from 'tests/testutils/request';
import {
	createAuth,
	createUser,
} from 'tests/testutils/seed';
import { describe, test, expect, beforeEach } from 'vitest';
import * as errors from '~/api/errors';
import { SESSION_COOKIE_NAME } from '~/auth/session';
import { UserResponse } from '~/handlers/users/user';

describe('AuthMiddleware', () => {
	beforeEach(async () => {
		await applyD1Migrations(env.DB, env.MIGRATIONS);
	});

	describe('API token', () => {
		test('Happy path', async () => {
			const user = await createUser(env);
			const auth = await createAuth(user);

			const res = await TestRequest.new('/api/users/@me').withAuth(auth).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<UserResponse>();
			expect(data.name).toBe(user.name);
			expect(data.apiToken).toBe(user.apiToken);
		});

		test('No Authorization header throws error', async () => {
			const res = await TestRequest.new('/api/users/@me').run();
			res.expectStatus(401);
			res.expectFailure();
			res.expectError(errors.NoAuthentication);
		});

		test('Authorization header must start with bearer', async () => {
			const res = await TestRequest.new('/api/users/@me', { headers: {
				Authorization: 'API_TOKEN',
			}})
				.run();
			res.expectStatus(401);
			res.expectFailure();
			res.expectError(errors.InvalidAuthHeader);
		});

		test('Invalid API token throws error', async () => {
			const res = await TestRequest.new('/api/users/@me', { headers: {
				Authorization: 'Bearer API_TOKEN',
			}})
				.run();
			res.expectStatus(401);
			res.expectFailure();
			res.expectError(errors.InvalidApiToken);
		});
	});

	describe('Session token', () => {
		test('Happy path', async () => {
			const user = await createUser(env);
			const auth = await createAuth(user);

			const res = await TestRequest.new('/api/users/@me').withAuth(auth, 'session').run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<UserResponse>();
			expect(data.name).toBe(user.name);
			expect(data.apiToken).toBe(user.apiToken);
		});

		test('No session token throws error', async () => {
			const res = await TestRequest.new('/api/users/@me').run();
			res.expectStatus(401);
			res.expectFailure();
			res.expectError(errors.NoAuthentication);
		});

		test('Invalid session token throws error', async () => {
			const res = await TestRequest.new('/api/users/@me', { headers: {
				Cookie: `${SESSION_COOKIE_NAME}=INVALID_SESSION_ID`,
			}}).run();
			res.expectStatus(401);
			res.expectFailure();
			res.expectError(errors.InvalidSessionId);
		});
	});
});
