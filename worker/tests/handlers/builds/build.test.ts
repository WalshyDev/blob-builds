import { applyD1Migrations, env } from 'cloudflare:test';
import JSZip from 'jszip';
import { TestRequest, createDownloadRequest, createUploadRequest } from 'tests/testutils/request';
import {
	createAuth,
	createBuild,
	createJarFile,
	createProject,
	createReleaseChannel,
	createSeededJar,
	createUser,
	init,
} from 'tests/testutils/seed';
import { describe, test, expect, beforeEach } from 'vitest';
import { parse, stringify } from 'yaml';
import * as errors from '~/api/errors';
import { GetAllBuildsResponse } from '~/handlers/builds/build';
import ProjectSettingStore from '~/store/ProjectSettingStore';
import ReleaseChannelStore from '~/store/ReleaseChannelStore';
import { getFilePath } from '~/utils/build';

describe('/api/builds', () => {
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
			const testRc = await createReleaseChannel(env, project, { name: 'Test' });

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
			const testRc = await createReleaseChannel(env, project, { name: 'Test' });

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

	describe('GET /:projectName/:releaseChannel/latest', () => {
		test('Can get latest build for default release channel', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			// Create a build
			const jar = await createJarFile();
			const testBuild = await createBuild(env, project, jar);

			const res = await TestRequest.new(`/api/builds/${project.name}/Dev/latest`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<BuildResponse>();
			expect(data.buildId).toBe(testBuild.buildId);
		});

		test('Can get latest build for another release channel', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);
			const testRc = await createReleaseChannel(env, project, { name: 'Test' });

			// Create a build
			const jar = await createJarFile();
			const testBuild = await createBuild(env, project, jar, { releaseChannelId: testRc.releaseChannelId });

			const res = await TestRequest.new(`/api/builds/${project.name}/${testRc.name}/latest`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<BuildResponse>();
			expect(data.buildId).toBe(testBuild.buildId);
		});

		test('Can get latest build if multiple builds', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			// Create a build
			const jar = await createJarFile();
			const testBuildOne = await createBuild(env, project, jar);
			const testBuildTwo = await createBuild(env, project, jar);
			const testBuildThree = await createBuild(env, project, jar);

			const res = await TestRequest.new(`/api/builds/${project.name}/Dev/latest`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<BuildResponse>();
			expect(data.buildId).not.toBe(testBuildOne.buildId);
			expect(data.buildId).not.toBe(testBuildTwo.buildId);
			expect(data.buildId).toBe(testBuildThree.buildId);
		});

		test('Invalid project name returns 404', async () => {
			const res = await TestRequest.new('/api/builds/invalid-project/Dev/latest').run();
			res.expectStatus(404);
			res.expectFailure();
			res.expectError(errors.ProjectNotFound);
		});

		test('Invalid release channel name returns 404', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			const res = await TestRequest.new(`/api/builds/${project.name}/Invalid/latest`).run();
			res.expectStatus(404);
			res.expectFailure();
			// Bit weird we return this but it's to save on a query. May change some day
			res.expectError(errors.BuildNotFound);
		});

		test('No builds returns 404', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			const res = await TestRequest.new(`/api/builds/${project.name}/Dev/latest`).run();
			res.expectStatus(404);
			res.expectFailure();
			res.expectError(errors.BuildNotFound);
		});
	});

	describe('GET /:projectName/:releaseChannel/:version', () => {
		test('Can get specific build for default release channel', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			// Create a build
			const jar = await createJarFile();
			const testBuild = await createBuild(env, project, jar);

			const res = await TestRequest.new(`/api/builds/${project.name}/Dev/${testBuild.buildId}`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<BuildResponse>();
			expect(data.buildId).toBe(testBuild.buildId);
		});

		test('Can get specific build for another release channel', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);
			const testRc = await createReleaseChannel(env, project, { name: 'Test' });

			// Create a build
			const jar = await createJarFile();
			const testBuild = await createBuild(env, project, jar, { releaseChannelId: testRc.releaseChannelId });

			const res = await TestRequest.new(`/api/builds/${project.name}/${testRc.name}/${testBuild.buildId}`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<BuildResponse>();
			expect(data.buildId).toBe(testBuild.buildId);
		});

		test('Can get specific build if multiple builds', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			// Create a build
			const jar = await createJarFile();
			const testBuildOne = await createBuild(env, project, jar);
			const testBuildTwo = await createBuild(env, project, jar);
			const testBuildThree = await createBuild(env, project, jar);

			// Test build 1
			let res = await TestRequest.new(`/api/builds/${project.name}/Dev/${testBuildOne.buildId}`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			let data = res.getData<BuildResponse>();
			expect(data.buildId).toBe(testBuildOne.buildId);

			// Test build 2
			res = await TestRequest.new(`/api/builds/${project.name}/Dev/${testBuildTwo.buildId}`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			data = res.getData<BuildResponse>();
			expect(data.buildId).toBe(testBuildTwo.buildId);

			// Test build 3
			res = await TestRequest.new(`/api/builds/${project.name}/Dev/${testBuildThree.buildId}`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			data = res.getData<BuildResponse>();
			expect(data.buildId).toBe(testBuildThree.buildId);
		});

		test('Invalid project name returns 404', async () => {
			const res = await TestRequest.new('/api/builds/invalid-project/Dev/1').run();
			res.expectStatus(404);
			res.expectFailure();
			res.expectError(errors.ProjectNotFound);
		});

		test('Invalid release channel name returns 404', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			const res = await TestRequest.new(`/api/builds/${project.name}/Invalid/1`).run();
			res.expectStatus(404);
			res.expectFailure();
			// Bit weird we return this but it's to save on a query. May change some day
			res.expectError(errors.BuildNotFound);
		});

		test('Non-existant build ID returns 404', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			const res = await TestRequest.new(`/api/builds/${project.name}/Dev/1000`).run();
			res.expectStatus(404);
			res.expectFailure();
			res.expectError(errors.BuildNotFound);
		});

		test('Invalid build ID returns 400', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			const res = await TestRequest.new(`/api/builds/${project.name}/Dev/invalid`).run();
			res.expectStatus(400);
			res.expectFailure();
			res.expectError(errors.InvalidBuildId);
		});
	});

	describe('POST /:projectName/:releaseChannel/upload', () => {
		describe('Happy path', () => {
			test('Can upload a build', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();
				const res = await createUploadRequest(auth, project, 'Dev', jar).run();
				res.expectStatus(200);
				res.expectSuccessful();

				// Confirm it displays in the build list
				const listRes = await TestRequest.new(`/api/builds/${project.name}/Dev/latest`).run();
				listRes.expectStatus(200);
				listRes.expectSuccessful();
				listRes.expectData();

				const buildData = listRes.getData<BuildResponse>();
				expect(buildData.buildId).toBe(1);
			});

			test('Can upload multiple builds', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jarOne = await createJarFile();
				const uploadOne = await createUploadRequest(auth, project, 'Dev', jarOne).run();
				uploadOne.expectStatus(200);
				uploadOne.expectSuccessful();

				const jarTwo = await createJarFile();
				const uploadTwo = await createUploadRequest(auth, project, 'Dev', jarTwo).run();
				uploadTwo.expectStatus(200);
				uploadTwo.expectSuccessful();

				// Confirm it displays in the build list
				const listRes = await TestRequest.new(`/api/builds/${project.name}/Dev`).run();
				listRes.expectStatus(200);
				listRes.expectSuccessful();
				listRes.expectData();

				const data = listRes.getData<GetAllBuildsResponse>();
				expect(data['Dev']).not.toBeUndefined();
				expect(data['Dev'].length).toBe(2);

				const buildOneData = data['Dev'][0];
				expect(buildOneData.buildId).toBe(2);

				const buildTwoData = data['Dev'][1];
				expect(buildTwoData.buildId).toBe(1);
			});

			test('Can upload to a different release channel', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);
				const testRc = await createReleaseChannel(env, project, { name: 'Test' });

				const jar = await createJarFile();
				const res = await createUploadRequest(auth, project, testRc.name, jar).run();
				res.expectStatus(200);
				res.expectSuccessful();

				// Confirm it displays in the build list
				const listRes = await TestRequest.new(`/api/builds/${project.name}/${testRc.name}/latest`).run();
				listRes.expectStatus(200);
				listRes.expectSuccessful();
				listRes.expectData();

				const buildData = listRes.getData<BuildResponse>();
				expect(buildData.buildId).toBe(1);
			});

			test('Can upload to a different release channel with multiple builds', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);
				const testRc = await createReleaseChannel(env, project, { name: 'Test' });

				const jarOne = await createJarFile();
				const uploadOne = await createUploadRequest(auth, project, testRc.name, jarOne).run();
				uploadOne.expectStatus(200);
				uploadOne.expectSuccessful();

				const jarTwo = await createJarFile();
				const uploadTwo = await createUploadRequest(auth, project, testRc.name, jarTwo).run();
				uploadTwo.expectStatus(200);
				uploadTwo.expectSuccessful();

				// Confirm it displays in the build list
				const listRes = await TestRequest.new(`/api/builds/${project.name}/${testRc.name}`).run();
				listRes.expectStatus(200);
				listRes.expectSuccessful();
				listRes.expectData();

				const data = listRes.getData<GetAllBuildsResponse>();
				expect(data['Test']).not.toBeUndefined();
				expect(data['Test'].length).toBe(2);

				const buildOneData = data['Test'][0];
				expect(buildOneData.buildId).toBe(2);

				const buildTwoData = data['Test'][1];
				expect(buildTwoData.buildId).toBe(1);
			});
		});

		describe('Validation', () => {
			describe('Upload validator', () => {
				test('Cannot send non-formdata', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);
					const rc = 'Dev';

					// Try a text body
					const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${auth.apiToken}`,
							'Content-Type': 'plain/text',
						},
						body: 'Test!',
					}).run();
					stringRes.expectStatus(400);
					stringRes.expectFailure();
					stringRes.expectError(errors.InvalidUpload('Invalid form data'));

					// Try a json body
					const jsonRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${auth.apiToken}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({}),
					}).run();
					jsonRes.expectStatus(400);
					jsonRes.expectFailure();
					jsonRes.expectError(errors.InvalidUpload('Invalid form data'));
				});

				test('Empty form data fails', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);
					const rc = 'Dev';

					const formData = new FormData();
					const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${auth.apiToken}`,
						},
						body: formData,
					}).run();
					stringRes.expectStatus(400);
					stringRes.expectFailure();
					stringRes.expectError(errors.InvalidUpload('File not provided'));
				});

				test('\'file\' has to be a file', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);
					const rc = 'Dev';

					const formData = new FormData();
					formData.append('file', 'test');

					const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${auth.apiToken}`,
						},
						body: formData,
					}).run();
					stringRes.expectStatus(400);
					stringRes.expectFailure();
					stringRes.expectError(errors.InvalidUpload('File not provided'));
				});

				test('Not providing metadata fails', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);
					const rc = 'Dev';

					const jar = await createJarFile();

					const formData = new FormData();
					formData.append('file', jar.blob);

					const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${auth.apiToken}`,
						},
						body: formData,
					}).run();
					stringRes.expectStatus(400);
					stringRes.expectFailure();
					stringRes.expectError(errors.InvalidUpload('Metadata not provided'));
				});

				test('Metadata must be a string', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);
					const rc = 'Dev';

					const jar = await createJarFile();

					const formData = new FormData();
					formData.append('file', jar.blob);
					formData.append('metadata', jar.blob);

					const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${auth.apiToken}`,
						},
						body: formData,
					}).run();
					stringRes.expectStatus(400);
					stringRes.expectFailure();
					stringRes.expectError(errors.InvalidUpload('Metadata not provided'));
				});

				test('Metadata must be a JSON string', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);
					const rc = 'Dev';

					const jar = await createJarFile();

					const formData = new FormData();
					formData.append('file', jar.blob);
					formData.append('metadata', 'test');

					const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${auth.apiToken}`,
						},
						body: formData,
					}).run();
					stringRes.expectStatus(400);
					stringRes.expectFailure();
					stringRes.expectError(errors.InvalidUpload('Metadata is invalid json'));
				});

				describe('\'checksum\'', () => {
					test('Metadata must have \'checksum\'', async () => {
						const user = await createUser(env);
						const auth = await createAuth(user);
						const project = await createProject(env, user);
						const rc = 'Dev';

						const jar = await createJarFile();

						const formData = new FormData();
						formData.append('file', jar.blob);
						formData.append('metadata', JSON.stringify({}));

						const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
							method: 'POST',
							headers: {
								Authorization: `Bearer ${auth.apiToken}`,
							},
							body: formData,
						}).run();
						stringRes.expectStatus(400);
						stringRes.expectFailure();
						stringRes.expectError(errors.InvalidJson('checksum: Required'));
					});

					test('\'checksum\' must be a string', async () => {
						const user = await createUser(env);
						const auth = await createAuth(user);
						const project = await createProject(env, user);
						const rc = 'Dev';

						const jar = await createJarFile();

						const formData = new FormData();
						formData.append('file', jar.blob);
						formData.append('metadata', JSON.stringify({ checksum: 1 }));

						const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
							method: 'POST',
							headers: {
								Authorization: `Bearer ${auth.apiToken}`,
							},
							body: formData,
						}).run();
						stringRes.expectStatus(400);
						stringRes.expectFailure();
						stringRes.expectError(errors.InvalidJson('checksum: Expected string, received number'));
					});

					test('\'checksum\' must be 64 characters', async () => {
						const user = await createUser(env);
						const auth = await createAuth(user);
						const project = await createProject(env, user);
						const rc = 'Dev';

						const jar = await createJarFile();

						const formData = new FormData();
						formData.append('file', jar.blob);
						formData.append('metadata', JSON.stringify({ checksum: 'a'.repeat(63) }));

						const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
							method: 'POST',
							headers: {
								Authorization: `Bearer ${auth.apiToken}`,
							},
							body: formData,
						}).run();
						stringRes.expectStatus(400);
						stringRes.expectFailure();
						stringRes.expectError(errors.InvalidJson('checksum: String must contain exactly 64 character(s)'));
					});
				});

				describe('\'supportedVersions\'', () => {
					test('\'supportedVersions\' must be a string', async () => {
						const user = await createUser(env);
						const auth = await createAuth(user);
						const project = await createProject(env, user);
						const rc = 'Dev';

						const jar = await createJarFile();

						const formData = new FormData();
						formData.append('file', jar.blob);
						formData.append('metadata', JSON.stringify({ checksum: 'a'.repeat(64), supportedVersions: 1 }));

						const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
							method: 'POST',
							headers: {
								Authorization: `Bearer ${auth.apiToken}`,
							},
							body: formData,
						}).run();
						stringRes.expectStatus(400);
						stringRes.expectFailure();
						stringRes.expectError(errors.InvalidJson('supportedVersions: Expected string, received number'));
					});
				});

				describe('\'dependencies\'', () => {
					test('\'dependencies\' must be an array', async () => {
						const user = await createUser(env);
						const auth = await createAuth(user);
						const project = await createProject(env, user);
						const rc = 'Dev';

						const jar = await createJarFile();

						const formData = new FormData();
						formData.append('file', jar.blob);
						formData.append('metadata', JSON.stringify({ checksum: 'a'.repeat(64), dependencies: 'test' }));

						const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
							method: 'POST',
							headers: {
								Authorization: `Bearer ${auth.apiToken}`,
							},
							body: formData,
						}).run();
						stringRes.expectStatus(400);
						stringRes.expectFailure();
						stringRes.expectError(errors.InvalidJson('dependencies: Expected array, received string'));
					});

					test('\'dependencies\' must be a string array', async () => {
						const user = await createUser(env);
						const auth = await createAuth(user);
						const project = await createProject(env, user);
						const rc = 'Dev';

						const jar = await createJarFile();

						const formData = new FormData();
						formData.append('file', jar.blob);
						formData.append('metadata', JSON.stringify({ checksum: 'a'.repeat(64), dependencies: [1, 2] }));

						const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
							method: 'POST',
							headers: {
								Authorization: `Bearer ${auth.apiToken}`,
							},
							body: formData,
						}).run();
						stringRes.expectStatus(400);
						stringRes.expectFailure();
						stringRes.expectError(
							errors.InvalidJson('dependencies: Expected string, received number -- Expected string, received number'),
						);
					});
				});

				describe('\'releaseNotes\'', () => {
					test('\'releaseNotes\' must be a string', async () => {
						const user = await createUser(env);
						const auth = await createAuth(user);
						const project = await createProject(env, user);
						const rc = 'Dev';

						const jar = await createJarFile();

						const formData = new FormData();
						formData.append('file', jar.blob);
						formData.append('metadata', JSON.stringify({ checksum: 'a'.repeat(64), releaseNotes: 1 }));

						const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
							method: 'POST',
							headers: {
								Authorization: `Bearer ${auth.apiToken}`,
							},
							body: formData,
						}).run();
						stringRes.expectStatus(400);
						stringRes.expectFailure();
						stringRes.expectError(errors.InvalidJson('releaseNotes: Expected string, received number'));
					});
				});

				describe('\'commitHash\'', () => {
					test('\'commitHash\' must be a string', async () => {
						const user = await createUser(env);
						const auth = await createAuth(user);
						const project = await createProject(env, user);
						const rc = 'Dev';

						const jar = await createJarFile();

						const formData = new FormData();
						formData.append('file', jar.blob);
						formData.append('metadata', JSON.stringify({ checksum: 'a'.repeat(64), commitHash: 1 }));

						const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
							method: 'POST',
							headers: {
								Authorization: `Bearer ${auth.apiToken}`,
							},
							body: formData,
						}).run();
						stringRes.expectStatus(400);
						stringRes.expectFailure();
						stringRes.expectError(errors.InvalidJson('commitHash: Expected string, received number'));
					});

					test('\'commitHash\' must be at least 7 characters', async () => {
						const user = await createUser(env);
						const auth = await createAuth(user);
						const project = await createProject(env, user);
						const rc = 'Dev';

						const jar = await createJarFile();

						const formData = new FormData();
						formData.append('file', jar.blob);
						formData.append('metadata', JSON.stringify({ checksum: 'a'.repeat(64), commitHash: 'a'.repeat(6) }));

						const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
							method: 'POST',
							headers: {
								Authorization: `Bearer ${auth.apiToken}`,
							},
							body: formData,
						}).run();
						stringRes.expectStatus(400);
						stringRes.expectFailure();
						stringRes.expectError(errors.InvalidJson(
							'commitHash: commitHash needs to be at least 7 characters',
						));
					});

					test('\'commitHash\' must be at most 64 characters', async () => {
						const user = await createUser(env);
						const auth = await createAuth(user);
						const project = await createProject(env, user);
						const rc = 'Dev';

						const jar = await createJarFile();

						const formData = new FormData();
						formData.append('file', jar.blob);
						formData.append('metadata', JSON.stringify({ checksum: 'a'.repeat(64), commitHash: 'a'.repeat(65) }));

						const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
							method: 'POST',
							headers: {
								Authorization: `Bearer ${auth.apiToken}`,
							},
							body: formData,
						}).run();
						stringRes.expectStatus(400);
						stringRes.expectFailure();
						stringRes.expectError(errors.InvalidJson(
							'commitHash: commitHash needs to be at most 64 characters',
						));
					});
				});

				test('\'commitHash\' must be a valid hex string', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);
					const rc = 'Dev';

					const jar = await createJarFile();

					const formData = new FormData();
					formData.append('file', jar.blob);
					formData.append('metadata', JSON.stringify({
						checksum: 'a'.repeat(64),
						commitHash: 'zxyNotHex',
					}));

					const stringRes = await TestRequest.new(`/api/builds/${project.name}/${rc}/upload`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${auth.apiToken}`,
						},
						body: formData,
					}).run();
					stringRes.expectStatus(400);
					stringRes.expectFailure();
					stringRes.expectError(errors.InvalidJson(
						'commitHash: commitHash doesn\'t look like a valid commit hash',
					));
				});
			});

			test('Invalid project name returns 404', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();
				const res = await createUploadRequest(auth, { ...project, name: 'invalid-project' }, 'Dev', jar).run();
				res.expectStatus(404);
				res.expectFailure();
				res.expectError(errors.ProjectNotFound);
			});

			test('Cannot upload to another users project', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);

				const otherUser = await createUser(env);
				const otherProject = await createProject(env, otherUser);

				const jar = await createJarFile();
				const res = await createUploadRequest(auth, otherProject, 'Dev', jar).run();
				res.expectStatus(404);
				res.expectFailure();
				res.expectError(errors.ProjectNotFound);
			});

			test('Invalid release channel name returns 404', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();
				const res = await createUploadRequest(auth, project, 'Invalid', jar).run();
				res.expectStatus(404);
				res.expectFailure();
				res.expectError(errors.ReleaseChannelNotFound);
			});

			test('File name must end in .jar', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();
				jar.name = 'test.gz';
				const res = await createUploadRequest(auth, project, 'Dev', jar).run();
				res.expectStatus(400);
				res.expectFailure();
				res.expectError(errors.InvalidUpload('File must be a jar file'));
			});

			test('Checksum must be correct', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();
				jar.hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
				const res = await createUploadRequest(auth, project, 'Dev', jar).run();
				res.expectStatus(400);
				res.expectFailure();
				res.expectError(errors.InvalidUpload('Checksum does not match'));
			});

			test('Build ID will be 1 if no builds', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();
				const res = await createUploadRequest(auth, project, 'Dev', jar).run();
				res.expectStatus(200);
				res.expectSuccessful();

				const latestBuild = await TestRequest.new(`/api/builds/${project.name}/Dev/latest`).run();
				latestBuild.expectStatus(200);
				latestBuild.expectSuccessful();
				latestBuild.expectData();

				const data = latestBuild.getData<BuildResponse>();
				expect(data.buildId).toBe(1);
			});

			describe('plugin yaml overwriting', () => {
				test('plugin.yml is overwritten with the build ID', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);
					const jsZip = new JSZip();

					const jar = await createJarFile();
					const unmodifiedJarFile = await jsZip.loadAsync(jar.bytes);

					// Confirm the old plugin.yml version
					const unmodifiedPluginYaml = unmodifiedJarFile.file('plugin.yml');
					expect(unmodifiedPluginYaml).not.toBeUndefined();
					const unmodifiedContent = await unmodifiedPluginYaml!.async('string');
					expect(unmodifiedContent).toContain('version: 1.0');

					const res = await createUploadRequest(auth, project, 'Dev', jar).run();
					res.expectStatus(200);
					res.expectSuccessful();

					// Download the jar
					const downloadRes = await createDownloadRequest(project, 'Dev').run();
					downloadRes.expectStatus(200);

					const arrayBuffer = await downloadRes.getBody().arrayBuffer();
					const jarFile = await jsZip.loadAsync(arrayBuffer);

					// Verify the version string is now modified
					const pluginYaml = jarFile.file('plugin.yml');
					expect(pluginYaml).not.toBeUndefined();
					const content = await pluginYaml!.async('string');

					expect(content).toContain('version: Dev - 1');
				});

				test('If disabled, the plugin.yml version will not be overriden', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);
					const jsZip = new JSZip();

					// Disable version overwriting
					const newSettings = await init(env,
						() => ProjectSettingStore.updateSettings(project.projectId, { overwritePluginYml: false }),
					);
					expect(newSettings).not.toBeUndefined();
					expect(newSettings.overwritePluginYml).toBe(false);

					const jar = await createJarFile();
					const unmodifiedJarFile = await jsZip.loadAsync(jar.bytes);

					// Confirm the old plugin.yml version
					const unmodifiedPluginYaml = unmodifiedJarFile.file('plugin.yml');
					expect(unmodifiedPluginYaml).not.toBeUndefined();
					const unmodifiedContent = await unmodifiedPluginYaml!.async('string');
					expect(unmodifiedContent).toContain('version: 1.0');

					const res = await createUploadRequest(auth, project, 'Dev', jar).run();
					res.expectStatus(200);
					res.expectSuccessful();

					// Download the jar
					const downloadRes = await createDownloadRequest(project, 'Dev').run();
					downloadRes.expectStatus(200);

					const arrayBuffer = await downloadRes.getBody().arrayBuffer();
					const jarFile = await jsZip.loadAsync(arrayBuffer);

					// Verify the version string is now modified
					const pluginYaml = jarFile.file('plugin.yml');
					expect(pluginYaml).not.toBeUndefined();
					const content = await pluginYaml!.async('string');

					expect(content).toContain('version: 1.0');
				});

				test('Will look for plugin.yaml if plugin.yml is not found', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);
					const jsZip = new JSZip();

					const jar = await createJarFile();
					// Modify the jar to remove plugin.yml and add plugin.yaml
					const modifiedJarFile = await jsZip.loadAsync(jar.bytes);
					const pluginYml = modifiedJarFile.file('plugin.yml');
					const pluginYmlContent = await pluginYml!.async('string');
					modifiedJarFile.remove('plugin.yml');
					modifiedJarFile.file('plugin.yaml', pluginYmlContent);

					// Make new jar
					const bytes = await jsZip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
					const modifiedJar = createSeededJar(bytes, 'test.jar');

					// Verify the upload was still successful
					const res = await createUploadRequest(auth, project, 'Dev', modifiedJar).run();
					res.expectStatus(200);
					res.expectSuccessful();

					// Download the jar
					const downloadRes = await createDownloadRequest(project, 'Dev').run();
					downloadRes.expectStatus(200);

					const arrayBuffer = await downloadRes.getBody().arrayBuffer();
					const jarFile = await jsZip.loadAsync(arrayBuffer);

					// Verify the version string is now modified
					const pluginYaml = jarFile.file('plugin.yaml');
					expect(pluginYaml).not.toBeUndefined();
					const content = await pluginYaml!.async('string');

					expect(content).toContain('version: Dev - 1');
				});

				test('Supports paper-plugin.yml', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);
					const jsZip = new JSZip();

					const jar = await createJarFile();
					// Modify the jar to remove plugin.yml and add paper-plugin.yml
					const modifiedJarFile = await jsZip.loadAsync(jar.bytes);
					const pluginYml = modifiedJarFile.file('plugin.yml');
					const pluginYmlContent = await pluginYml!.async('string');
					modifiedJarFile.remove('plugin.yml');
					modifiedJarFile.file('paper-plugin.yml', pluginYmlContent);

					// Make new jar
					const bytes = await jsZip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
					const modifiedJar = createSeededJar(bytes, 'test.jar');

					// Verify the upload was still successful
					const res = await createUploadRequest(auth, project, 'Dev', modifiedJar).run();
					res.expectStatus(200);
					res.expectSuccessful();

					// Download the jar
					const downloadRes = await createDownloadRequest(project, 'Dev').run();
					downloadRes.expectStatus(200);

					const arrayBuffer = await downloadRes.getBody().arrayBuffer();
					const jarFile = await jsZip.loadAsync(arrayBuffer);

					// Verify the version string is now modified
					const pluginYaml = jarFile.file('paper-plugin.yml');
					expect(pluginYaml).not.toBeUndefined();
					const content = await pluginYaml!.async('string');

					expect(content).toContain('version: Dev - 1');
				});

				test('Will look for paper-plugin.yaml if no paper-plugin.yml', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);
					const jsZip = new JSZip();

					const jar = await createJarFile();
					// Modify the jar to remove plugin.yml and add paper-plugin.yaml
					const modifiedJarFile = await jsZip.loadAsync(jar.bytes);
					const pluginYml = modifiedJarFile.file('plugin.yml');
					const pluginYmlContent = await pluginYml!.async('string');
					modifiedJarFile.remove('plugin.yml');
					modifiedJarFile.file('paper-plugin.yaml', pluginYmlContent);

					// Make new jar
					const bytes = await jsZip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
					const modifiedJar = createSeededJar(bytes, 'test.jar');

					// Verify the upload was still successful
					const res = await createUploadRequest(auth, project, 'Dev', modifiedJar).run();
					res.expectStatus(200);
					res.expectSuccessful();

					// Download the jar
					const downloadRes = await createDownloadRequest(project, 'Dev').run();
					downloadRes.expectStatus(200);

					const arrayBuffer = await downloadRes.getBody().arrayBuffer();
					const jarFile = await jsZip.loadAsync(arrayBuffer);

					// Verify the version string is now modified
					const pluginYaml = jarFile.file('paper-plugin.yaml');
					expect(pluginYaml).not.toBeUndefined();
					const content = await pluginYaml!.async('string');

					expect(content).toContain('version: Dev - 1');
				});

				test('Will fail if neither plugin.yml or plugin.yaml is found', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);
					const jsZip = new JSZip();

					const jar = await createJarFile();
					// Modify the jar to remove plugin.yml
					const modifiedJarFile = await jsZip.loadAsync(jar.bytes);
					modifiedJarFile.remove('plugin.yml');

					// Make new jar
					const bytes = await jsZip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
					const modifiedJar = createSeededJar(bytes, 'test.jar');

					// Attempt to upload the jar
					const res = await createUploadRequest(auth, project, 'Dev', modifiedJar).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidUpload('plugin.yml or paper-plugin.yml not found'));
				});

				test('Will fail if plugin.yml does not contain a version', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);
					const jsZip = new JSZip();

					const jar = await createJarFile();

					// Modify the jar to remove version from plugin.yml
					const modifiedJarFile = await jsZip.loadAsync(jar.bytes);
					const pluginYml = modifiedJarFile.file('plugin.yml');
					const pluginYmlContent = await pluginYml!.async('string');
					const parsed = parse(pluginYmlContent);
					delete parsed.version;

					const newYaml = stringify(parsed);
					modifiedJarFile.file('plugin.yml', newYaml);

					// Make new jar
					const bytes = await jsZip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
					const modifiedJar = createSeededJar(bytes, 'test.jar');

					// Attempt to upload the jar
					const res = await createUploadRequest(auth, project, 'Dev', modifiedJar).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidUpload('plugin yml does not contain a version'));
				});
			});

			test('Files are being uploaded to R2', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();
				const res = await createUploadRequest(auth, project, 'Dev', jar).run();
				res.expectStatus(200);
				res.expectSuccessful();

				// Confirm it displays in the build list
				const listRes = await TestRequest.new(`/api/builds/${project.name}/Dev/latest`).run();
				listRes.expectStatus(200);
				listRes.expectSuccessful();
				listRes.expectData();

				const buildData = listRes.getData<BuildResponse>();
				expect(buildData.buildId).toBe(1);

				const rc = await init(env, () => ReleaseChannelStore.getReleaseChannel('Dev', project.projectId));
				expect(rc).not.toBeUndefined();

				const ps = env.DB.prepare(`
					SELECT file_hash FROM builds
					WHERE project_id = $1 AND release_channel_id = $2 AND build_id = $3
				`)
					.bind(project.projectId, rc!.releaseChannelId, 1);
				const result = await ps.first();
				const path = getFilePath(project.name, 'Dev', result!.file_hash as string);

				const file = await env.R2.head(path);
				expect(file).not.toBeNull();
			});
		});
	});
});
