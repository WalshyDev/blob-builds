import { applyD1Migrations, env } from 'cloudflare:test';
import { createDownloadRequest, createUploadRequest } from 'tests/testutils/request';
import {
	createAuth,
	createJarFile,
	createProject,
	createUser,
} from 'tests/testutils/seed';
import { describe, test, expect, beforeEach } from 'vitest';
import * as errors from '~/api/errors';
import { getFilePath, getLegacyFilePath } from '~/utils/build';

describe('/dl', () => {
	beforeEach(async () => {
		await applyD1Migrations(env.DB, env.MIGRATIONS);
	});

	describe('GET /:projectName/:releaseChannel/latest', () => {
		describe('Happy path', () => {
			test('Can download latest build', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();

				const res = await createUploadRequest(auth, project, 'Dev', jar).run();
				res.expectStatus(200);
				res.expectSuccessful();

				// Download the jar
				const downloadRes = await createDownloadRequest(project, 'Dev').run();
				downloadRes.expectStatus(200);
				await downloadRes.getBody().body?.cancel(); // Cancel the stream - cloudflare/workers-sdk#5524
			});

			test('Can download specific build', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();

				const res = await createUploadRequest(auth, project, 'Dev', jar).run();
				res.expectStatus(200);
				res.expectSuccessful();

				// Download the jar
				const downloadRes = await createDownloadRequest(project, 'Dev', '1').run();
				downloadRes.expectStatus(200);
				await downloadRes.getBody().body?.cancel(); // Cancel the stream - cloudflare/workers-sdk#5524
			});

			test('Can download build with legacy path', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();

				const res = await createUploadRequest(auth, project, 'Dev', jar).run();
				res.expectStatus(200);
				res.expectSuccessful();
				res.expectData();

				const build = res.getData<BuildResponse>();

				const path = getFilePath(project.name, 'Dev', build.checksum);
				const legacyPath = getLegacyFilePath(project.name, 'Dev', build.checksum);

				// Move the file to the old path
				const file = await env.R2.get(path);
				expect(file).not.toBeNull();
				await env.R2.put(legacyPath, file!.body, {
					httpMetadata: file!.httpMetadata,
					sha256: file!.checksums.sha256,
				});

				// Delete the file from the modern path
				await env.R2.delete(path);

				// Download the jar
				const downloadRes = await createDownloadRequest(project, 'Dev').run();
				downloadRes.expectStatus(200);
				await downloadRes.getBody().body?.cancel(); // Cancel the stream - cloudflare/workers-sdk#5524
			});
		});

		describe('Validation', () => {
			test('Non-existent project should fail', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();

				const res = await createUploadRequest(auth, project, 'Dev', jar).run();
				res.expectStatus(200);
				res.expectSuccessful();

				project.name = 'non-existent-project';

				// Download the jar
				const downloadRes = await createDownloadRequest(project, 'Dev').run();
				downloadRes.expectStatus(404);
				downloadRes.expectFailure();
				downloadRes.expectError(errors.ProjectNotFound);
			});

			test('Non-existent release channel should fail', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();

				const res = await createUploadRequest(auth, project, 'Dev', jar).run();
				res.expectStatus(200);
				res.expectSuccessful();

				// Download the jar
				const downloadRes = await createDownloadRequest(project, 'Test').run();
				downloadRes.expectStatus(404);
				downloadRes.expectFailure();
				downloadRes.expectError(errors.ReleaseChannelNotFound);
			});

			test('Invalid version specified should fail', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();

				const res = await createUploadRequest(auth, project, 'Dev', jar).run();
				res.expectStatus(200);
				res.expectSuccessful();

				// Download the jar
				const downloadRes = await createDownloadRequest(project, 'Dev', 'hello-world').run();
				downloadRes.expectStatus(400);
				downloadRes.expectFailure();
				downloadRes.expectError(errors.InvalidBuildId);
			});

			test('Non-existent version specified should fail', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();

				const res = await createUploadRequest(auth, project, 'Dev', jar).run();
				res.expectStatus(200);
				res.expectSuccessful();

				// Download the jar
				const downloadRes = await createDownloadRequest(project, 'Dev', '4').run();
				downloadRes.expectStatus(404);
				downloadRes.expectFailure();
				downloadRes.expectError(errors.BuildNotFound);
			});

			test('No builds should fail on latest', async () => {
				const user = await createUser(env);
				const project = await createProject(env, user);

				// Download the jar
				const downloadRes = await createDownloadRequest(project, 'Dev').run();
				downloadRes.expectStatus(404);
				downloadRes.expectFailure();
				downloadRes.expectError(errors.BuildNotFound);
			});

			test('Build not existing in R2 should fail', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const jar = await createJarFile();

				const res = await createUploadRequest(auth, project, 'Dev', jar).run();
				res.expectStatus(200);
				res.expectSuccessful();
				res.expectData();

				const build = res.getData<BuildResponse>();

				const path = getFilePath(project.name, 'Dev', build.checksum);

				// Delete the file from R2
				await env.R2.delete(path);

				// Download the jar
				const downloadRes = await createDownloadRequest(project, 'Dev').run();
				downloadRes.expectStatus(404);
				downloadRes.expectFailure();
				downloadRes.expectError(errors.BuildNotFound);
			});
		});
	});
});
