import { applyD1Migrations, env } from 'cloudflare:test';
import { TestRequest } from 'tests/testutils/request';
import { createProject, createUser } from 'tests/testutils/seed';
import { describe, test, expect, beforeEach } from 'vitest';
import * as errors from '~/api/errors';

describe('/api/search', () => {
	beforeEach(async () => {
		await applyD1Migrations(env.DB, env.MIGRATIONS);
	});

	describe('Happy path', () => {
		test('Can search projects', async () => {
			const userOne = await createUser(env, { name: 'user-1' });
			const userTwo = await createUser(env, { name: 'user-2' });

			// Create a few projects
			const testProjectOne = await createProject(env, userOne, { name: 'test1' });
			const testProjectTwo = await createProject(env, userOne, { name: 'test-2' });
			// Third project is owned by a different user
			const testProjectThree = await createProject(env, userTwo, { name: 'abc-test' });
			// Should not be matched
			const testProjectFour = await createProject(env, userOne, { name: 'abcdef' });
			
			const res = await TestRequest.new('/api/search', { method: 'POST' }).withJson({ query: 'test' }).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const body = res.getData<ProjectResponse[]>();
			expect(body).toHaveLength(3);

			const projectNames = body.map((p) => p.name);
			expect(projectNames).toContain(testProjectOne.name);
			expect(projectNames).toContain(testProjectTwo.name);
			expect(projectNames).toContain(testProjectThree.name);
			expect(projectNames).not.toContain(testProjectFour.name);
		});

		test('Can search users', async () => {
			const userOne = await createUser(env, { name: 'user-1' });
			const userTwo = await createUser(env, { name: 'user-2' });
			const userThree = await createUser(env, { name: 'walshy' });

			// Create a few projects
			const testProjectOne = await createProject(env, userOne, { name: 'test1' });
			const testProjectTwo = await createProject(env, userOne, { name: 'test-2' });
			// Third project is owned by a different user
			const testProjectThree = await createProject(env, userTwo, { name: 'abc-test' });
			// Should not be matched
			const testProjectFour = await createProject(env, userThree, { name: 'abcdef' });
			
			const res = await TestRequest.new('/api/search', { method: 'POST' }).withJson({ query: 'user' }).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const body = res.getData<ProjectResponse[]>();
			expect(body).toHaveLength(3);

			const projectNames = body.map((p) => p.name);
			expect(projectNames).toContain(testProjectOne.name);
			expect(projectNames).toContain(testProjectTwo.name);
			expect(projectNames).toContain(testProjectThree.name);
			expect(projectNames).not.toContain(testProjectFour.name);
		});

		test('Can search projects and users', async () => {
			const userOne = await createUser(env, { name: 'user-1' });
			const userTwo = await createUser(env, { name: 'user-2' });
			const userThree = await createUser(env, { name: 'walshy-test' });

			// Create a few projects
			const testProjectOne = await createProject(env, userOne, { name: 'test1' });
			const testProjectTwo = await createProject(env, userOne, { name: 'test-2' });
			// Third project is owned by a different user
			const testProjectThree = await createProject(env, userTwo, { name: 'abc-test' });
			// Should not be matched
			const testProjectFour = await createProject(env, userThree, { name: 'abcdef' });
			
			const res = await TestRequest.new('/api/search', { method: 'POST' }).withJson({ query: 'test' }).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const body = res.getData<ProjectResponse[]>();
			expect(body).toHaveLength(4);

			const projectNames = body.map((p) => p.name);
			expect(projectNames).toContain(testProjectOne.name);   // Matched project naem
			expect(projectNames).toContain(testProjectTwo.name);   // Matched project naem
			expect(projectNames).toContain(testProjectThree.name); // Matched project naem
			expect(projectNames).toContain(testProjectFour.name);  // Matched user name
		});

		test('Exact match should return one value', async () => {
			const userOne = await createUser(env, { name: 'user-1' });
			const userTwo = await createUser(env, { name: 'user-2' });
			const userThree = await createUser(env, { name: 'walshy-test' });

			// Create a few projects
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const _proj1 = await createProject(env, userOne, { name: 'test1' });
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const _proj2 = await createProject(env, userOne, { name: 'test-2' });
			// Third project is owned by a different user
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const _proj3 = await createProject(env, userTwo, { name: 'abc-test' });
			// Should not be matched
			const testProjectFour = await createProject(env, userThree, { name: 'abcdef' });
			
			// Exact match project
			const res = await TestRequest.new('/api/search', { method: 'POST' }).withJson({ query: 'abcdef' }).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const body = res.getData<ProjectResponse[]>();
			expect(body).toHaveLength(1);
			expect(body[0].name).toBe(testProjectFour.name);
		});
	});

	describe('Validation', () => {
		test('Query is required', async () => {
			const res = await TestRequest.new('/api/search', { method: 'POST' }).withJson({}).run();
			res.expectFailure();
			res.expectError(errors.InvalidJson('query is required'));
		});

		test('Query needs to be a string', async () => {
			const res = await TestRequest.new('/api/search', { method: 'POST' }).withJson({ query: 1 }).run();
			res.expectFailure();
			res.expectError(errors.InvalidJson('query must be a string'));
		});

		test('Query cannot be too long', async () => {
			const res = await TestRequest.new('/api/search', { method: 'POST' }).withJson({ query: 'a'.repeat(101) }).run();
			res.expectFailure();
			res.expectError(errors.InvalidJson('query needs to be at most 100 characters'));
		});
	});
});
