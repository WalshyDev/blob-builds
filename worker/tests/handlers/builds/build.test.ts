import { applyD1Migrations } from 'cloudflare:test';
import { env } from 'cloudflare:test';
import { TestRequest } from 'tests/testutils/request';
import { createBuild, createJarFile, createProject, createReleaseChannel, createUser } from 'tests/testutils/seed';
import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import * as errors from '~/api/errors';
import { GetAllBuildsResponse } from '~/handlers/builds/build';
// import worker from '~/index';

describe('/api/builds', () => {
	beforeAll(async () => {
		env.ENVIRONMENT = 'test';
	});

	beforeEach(async () => {
		await applyD1Migrations(env.DB, env.MIGRATIONS);
	});

	describe('GET /:projectName', () => {
		test('Can get project builds', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			// Create a build
			const jar = await createJarFile();
			const build = await createBuild(env, project, jar);

			const res = await TestRequest.new(`/api/builds/${project.name}`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<GetAllBuildsResponse>();
			expect(data['Dev']).not.toBeUndefined();
			expect(data['Dev'].length).toBe(1);

			const buildData = data['Dev'][0];
			expect(buildData.buildId).toBe(build.buildId);
			expect(buildData.checksum).toBe(jar.hash);
		});

		test('Can get project builds with multiple builds', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			// Create a build
			const jar = await createJarFile();
			const buildOne = await createBuild(env, project, jar);
			const buildTwo = await createBuild(env, project, jar);
			const buildThree = await createBuild(env, project, jar);

			const res = await TestRequest.new(`/api/builds/${project.name}`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<GetAllBuildsResponse>();
			expect(data['Dev']).not.toBeUndefined();
			expect(data['Dev'].length).toBe(3);

			// Expected order is newest to oldest
			const buildOneData = data['Dev'][2];
			expect(buildOneData.buildId).toBe(buildOne.buildId);
			expect(buildOneData.checksum).toBe(jar.hash);

			const buildTwoData = data['Dev'][1];
			expect(buildTwoData.buildId).toBe(buildTwo.buildId);
			expect(buildTwoData.checksum).toBe(jar.hash);

			const buildThreeData = data['Dev'][0];
			expect(buildThreeData.buildId).toBe(buildThree.buildId);
			expect(buildThreeData.checksum).toBe(jar.hash);
		});

		test('Can get project builds with multiple release channels', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);
			const testRc = (await createReleaseChannel(env, project, { name: 'Test' }))[0];

			// Create a build
			const jar = await createJarFile();
			const devBuild = await createBuild(env, project, jar);
			const testBuild = await createBuild(env, project, jar, { releaseChannelId: testRc.releaseChannelId });

			const res = await TestRequest.new(`/api/builds/${project.name}`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<GetAllBuildsResponse>();
			expect(data['Dev']).not.toBeUndefined();
			expect(data['Dev'].length).toBe(1);

			const buildData = data['Dev'][0];
			expect(buildData.buildId).toBe(devBuild.buildId);

			expect(data['Test']).not.toBeUndefined();
			expect(data['Test'].length).toBe(1);

			const testBuildData = data['Test'][0];
			expect(testBuildData.buildId).toBe(testBuild.buildId);
		});

		test('Invalid project name returns 404', async () => {
			const res = await TestRequest.new('/api/builds/invalid-project').run();
			res.expectStatus(404);
			res.expectFailure();
			res.expectError(errors.ProjectNotFound);
		});

		test('No builds returns empty build array', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			const res = await TestRequest.new(`/api/builds/${project.name}`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<GetAllBuildsResponse>();
			expect(data['Dev']).not.toBeUndefined();
			expect(data['Dev'].length).toBe(0);
		});
	});

	describe('GET /:projectName/:releaseChannel', () => {
		test('Can get project builds for a specific release channel', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			// Create a build
			const jar = await createJarFile();
			const testBuildOne = await createBuild(env, project, jar);
			const testBuildTwo = await createBuild(env, project, jar);

			const res = await TestRequest.new(`/api/builds/${project.name}/Dev`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<GetAllBuildsResponse>();
			expect(data['Dev']).not.toBeUndefined();
			expect(data['Dev'].length).toBe(2);

			const testBuildTwoData = data['Dev'][0];
			expect(testBuildTwoData.buildId).toBe(testBuildTwo.buildId);

			const testBuildOneData = data['Dev'][1];
			expect(testBuildOneData.buildId).toBe(testBuildOne.buildId);
		});

		test('Can get project builds for multiple release channels', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);
			const testRc = (await createReleaseChannel(env, project, { name: 'Test' }))[0];

			// Create builds
			const jar = await createJarFile();
			const testDevBuildOne = await createBuild(env, project, jar);
			const testDevBuildTwo = await createBuild(env, project, jar);

			const testBuildOne = await createBuild(env, project, jar, { releaseChannelId: testRc.releaseChannelId });
			const testBuildTwo = await createBuild(env, project, jar, { releaseChannelId: testRc.releaseChannelId });

			// Test Dev
			let res = await TestRequest.new(`/api/builds/${project.name}/Dev`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			let data = res.getData<GetAllBuildsResponse>();
			expect(data['Dev']).not.toBeUndefined();
			expect(data['Dev'].length).toBe(2);

			const testDevBuildTwoData = data['Dev'][0];
			expect(testDevBuildTwoData.buildId).toBe(testDevBuildTwo.buildId);

			const testDevBuildOneData = data['Dev'][1];
			expect(testDevBuildOneData.buildId).toBe(testDevBuildOne.buildId);

			// Test Test
			res = await TestRequest.new(`/api/builds/${project.name}/${testRc.name}`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			data = res.getData<GetAllBuildsResponse>();
			expect(data['Test']).not.toBeUndefined();
			expect(data['Test'].length).toBe(2);

			const testBuildTwoData = data['Test'][0];
			expect(testBuildTwoData.buildId).toBe(testBuildTwo.buildId);

			const testBuildOneData = data['Test'][1];
			expect(testBuildOneData.buildId).toBe(testBuildOne.buildId);
		});

		test('Invalid project name returns 404', async () => {
			const res = await TestRequest.new('/api/builds/invalid-project/Dev').run();
			res.expectStatus(404);
			res.expectFailure();
			res.expectError(errors.ProjectNotFound);
		});

		test('Invalid release channel name returns 404', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			const res = await TestRequest.new(`/api/builds/${project.name}/Invalid`).run();
			res.expectStatus(404);
			res.expectFailure();
			res.expectError(errors.ReleaseChannelNotFound);
		});

		test('No builds returns empty build array', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			const res = await TestRequest.new(`/api/builds/${project.name}/Dev`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<GetAllBuildsResponse>();
			expect(data['Dev']).not.toBeUndefined();
			expect(data['Dev'].length).toBe(0);
		});
	});
});
