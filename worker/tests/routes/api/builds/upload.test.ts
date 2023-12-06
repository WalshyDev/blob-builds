import JSZip from 'jszip';
import {
	MockJarOptions,
	createMockJarFile,
	createMockProject,
	createMockUser,
	setupWorker,
} from 'tests/testutils/test';
import { describe, test, expect, beforeAll } from 'vitest';
import { UnstableDevWorker } from 'wrangler';
import * as errors from '~/api/errors';
import { Build, Project, ReleaseChannel, User } from '~/store/schema';
import { UploadMetadata } from '~/utils/validator/uploadValidator';

describe('Test uploads', () => {
	let worker: UnstableDevWorker;
	let user: User;
	let project: Project;
	let devReleaseChannel: ReleaseChannel;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let releaseReleaseChannel: ReleaseChannel;

	beforeAll(async () => {
		worker = await setupWorker();

		user = await createMockUser(worker);
		const created = await createMockProject(worker, user, undefined, [{ name: 'dev' }, { name: 'release' }]);
		project = created.project;
		devReleaseChannel = created.releaseChannels[0];
		releaseReleaseChannel = created.releaseChannels[1];
	});

	describe('Invalid form data', () => {
		test('No form data', async () => {
			// Test no form data
			const formData = new FormData();

			const res = await worker.fetch(
				`https://worker.local/api/builds/${project.name}/${devReleaseChannel.name}/upload`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${user.apiToken}`,
					},
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					body: formData,
				},
			);

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidUpload('').getCode());
			expect(json.error).toBe(errors.InvalidUpload('File not provided').getErrorMessage());
		});

		test('No file', async () => {
			// Test just no file
			const formData = new FormData();
			formData.append('metadata', JSON.stringify({ checksum: '' }));

			const res = await worker.fetch(
				`https://worker.local/api/builds/${project.name}/${devReleaseChannel.name}/upload`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${user.apiToken}`,
					},
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					body: formData,
				},
			);

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidUpload('').getCode());
			expect(json.error).toBe(errors.InvalidUpload('File not provided').getErrorMessage());
		});

		test('No metadata', async () => {
			// Test just no metadata
			const formData = new FormData();
			formData.append('file', new Blob(['test'], { type: 'application/java-archive' }), 'test.jar');

			const res = await worker.fetch(
				`https://worker.local/api/builds/${project.name}/${devReleaseChannel.name}/upload`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${user.apiToken}`,
					},
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					body: formData,
				},
			);

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidUpload('').getCode());
			expect(json.error).toBe(errors.InvalidUpload('Metadata not provided').getErrorMessage());
		});

		test('Not jar', async () => {
			// Test just no metadata
			const formData = new FormData();
			formData.append('file', new Blob(['test'], { type: 'plain/text' }), 'test.txt');
			formData.append('metadata', JSON.stringify({
				checksum: 'f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2',
			}));

			const res = await worker.fetch(
				`https://worker.local/api/builds/${project.name}/${devReleaseChannel.name}/upload`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${user.apiToken}`,
					},
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					body: formData,
				},
			);

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidUpload('').getCode());
			expect(json.error).toBe(errors.InvalidUpload('File must be a jar file').getErrorMessage());
		});

		test('Missing checksum', async () => {
			// Test just no metadata
			const formData = new FormData();
			formData.append('file', new Blob(['test'], { type: 'application/java-archive' }), 'test.jar');
			formData.append('metadata', JSON.stringify({
				checksum: '',
			}));

			const res = await worker.fetch(
				`https://worker.local/api/builds/${project.name}/${devReleaseChannel.name}/upload`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${user.apiToken}`,
					},
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					body: formData,
				},
			);

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidJson('').getCode());
			expect(json.error).toBe(errors.InvalidJson('String must contain exactly 64 character(s)').getErrorMessage());
		});

		test('Invalid checksum', async () => {
			// Test just no metadata
			const formData = new FormData();
			formData.append('file', new Blob(['test'], { type: 'application/java-archive' }), 'test.jar');
			formData.append('metadata', JSON.stringify({
				checksum: 'a'.repeat(64),
			}));

			const res = await worker.fetch(
				`https://worker.local/api/builds/${project.name}/${devReleaseChannel.name}/upload`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${user.apiToken}`,
					},
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					body: formData,
				},
			);

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidUpload('').getCode());
			expect(json.error).toBe(errors.InvalidUpload('Checksum does not match').getErrorMessage());
		});
	});

	describe('Git info', () => {
		test('Commit hash too short', async () => {
			const res = await uploadFile(
				worker,
				user,
				project.name,
				devReleaseChannel.name,
				{ metadata: { commitHash: 'abc' } },
			);

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidJson('').getCode());
			expect(json.error).toBe(errors.InvalidJson('commitHash needs to be at least 7 characters').getErrorMessage());
		});

		test('Commit hash too long', async () => {
			const res = await uploadFile(
				worker,
				user,
				project.name,
				devReleaseChannel.name,
				{ metadata: { commitHash: 'a'.repeat(65) } },
			);

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidJson('').getCode());
			expect(json.error).toBe(errors.InvalidJson('commitHash needs to be at most 64 characters').getErrorMessage());
		});

		test('Commit hash needs to be hex', async () => {
			const res = await uploadFile(
				worker,
				user,
				project.name,
				devReleaseChannel.name,
				{ metadata: { commitHash: 'commit hash goes here' } },
			);

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidJson('').getCode());
			expect(json.error).toBe(
				errors.InvalidJson('commitHash doesn\'t look like a valid commit hash').getErrorMessage(),
			);
		});

		test('Can upload a build with commit hash', async () => {
			const { project, releaseChannels } = await createMockProject(
				worker,
				user,
				{ repoLink: 'https://github.com/Example/Example' },
				[{ name: 'dev' }],
			);
			const devChannel = releaseChannels[0];
			const res = await uploadFile(
				worker,
				user,
				project.name,
				devChannel.name,
				{ metadata: { commitHash: '356be0960e2c5be0f1c3bed92abc1aefbaa8c834311e2e4e64955efe0b7d67aa' } },
			);

			expect(res.status).toBe(200);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(true);
			if (json.success === false) {
				throw new Error('Expected success to be true');
			}

			// Confirm build exists
			const builds = await getBuilds<{ dev: BuildResponse[] }>(worker, project);
			expect(builds.dev).toBeDefined();

			const build = builds.dev[0];
			expect(build.buildId).toBe(1);
			expect(build.commitHash).toBe('356be0960e2c5be0f1c3bed92abc1aefbaa8c834311e2e4e64955efe0b7d67aa');
			expect(build.commitLink).toBe(
				'https://github.com/Example/Example/commit/356be0960e2c5be0f1c3bed92abc1aefbaa8c834311e2e4e64955efe0b7d67aa',
			);
		});
	});

	describe('Test plugin.yml', () => {
		test('No plugin.yml', async () => {
			const jarFile = await createMockJarFile({ pluginYml: null });

			const res = await uploadFile(worker, user, project.name, devReleaseChannel.name, {
				blob: jarFile.blob,
				metadata: {
					checksum: jarFile.hash,
				},
			});

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidUpload('').getCode());
			expect(json.error).toBe(errors.InvalidUpload('plugin.yml not found').getErrorMessage());
		});

		test('No version', async () => {
			const jarFile = await createMockJarFile({ pluginYml: 'name: Test' });

			const res = await uploadFile(worker, user, project.name, devReleaseChannel.name, {
				blob: jarFile.blob,
				metadata: {
					checksum: jarFile.hash,
				},
			});

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidUpload('').getCode());
			expect(json.error).toBe(errors.InvalidUpload('plugin.yml does not contain a version').getErrorMessage());
		});

		test('Version is updated', async () => {
			const { project, releaseChannels } = await createMockProject(worker, user, undefined, [{ name: 'dev' }]);
			const rc = releaseChannels[0];

			const res = await uploadFile(worker, user, project.name, rc.name);

			expect(res.status).toBe(200);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(true);
			if (json.success === false) {
				throw new Error('Expected success to be true');
			}

			// Confirm build exists
			const builds = await getBuilds<{ dev: Build[] }>(worker, project);
			expect(builds.dev).toBeDefined();
			expect(builds.dev.length).toBe(1);

			const build = builds.dev[0];
			expect(build.buildId).toBe(1);
			expect(build.supportedVersions).toBe('1.0');

			// Download the jar and verify version changed in the plugin.yml
			const downloadRes = await worker.fetch(`https://worker.local/dl/${project.name}/${rc.name}/latest`);
			const jar = await downloadRes.arrayBuffer();

			const jsZip = new JSZip();
			const zip = await jsZip.loadAsync(jar);
			const file = zip.file('plugin.yml');
			const pluginYml = await file.async('string');

			expect(pluginYml).toBe(`name: test-plugin\nversion: ${rc.name} - 1\nmain: TestPlugin.java\n`);
		});

		test('Overwriting plugin.yml is disabled', async () => {
			const { project, releaseChannels } = await createMockProject(worker, user, undefined, [{ name: 'dev' }]);
			const rc = releaseChannels[0];

			// Disable overwriting plugin.yml
			const updateSettingsRes = await worker.fetch(`https://worker.local/api/projects/${project.name}/settings`, {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${user.apiToken}` },
				body: JSON.stringify({
					overwritePluginYml: false,
				}),
			});
			expect(updateSettingsRes.status).toBe(200);

			const updateSettingsJson = await updateSettingsRes.json() as ApiResponse;
			expect(updateSettingsJson.success).toBe(true);
			if (updateSettingsJson.success === false) {
				throw new Error('Expected success to be true');
			}

			const expectedPluginYml = 'name: test-plugin\nversion: no-replace-me\nmain: TestPlugin.java\n';
			const res = await uploadFile(worker, user, project.name, rc.name, undefined, {
				pluginYml: expectedPluginYml,
			});

			expect(res.status).toBe(200);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(true);
			if (json.success === false) {
				throw new Error('Expected success to be true');
			}

			// Confirm build exists
			const builds = await getBuilds<{ dev: Build[] }>(worker, project);
			expect(builds.dev).toBeDefined();
			expect(builds.dev.length).toBe(1);

			const build = builds.dev[0];
			expect(build.buildId).toBe(1);
			expect(build.supportedVersions).toBe('1.0');

			// Download the jar and verify version changed in the plugin.yml
			const downloadRes = await worker.fetch(`https://worker.local/dl/${project.name}/${rc.name}/latest`);
			const jar = await downloadRes.arrayBuffer();

			const jsZip = new JSZip();
			const zip = await jsZip.loadAsync(jar);
			const file = zip.file('plugin.yml');
			const pluginYml = await file.async('string');

			expect(pluginYml).toBe(expectedPluginYml);
		});
	});

	describe('Valid uploads', () => {
		test('Can upload', async () => {
			const { project, releaseChannels } = await createMockProject(worker, user, undefined, [{ name: 'dev' }]);
			const devChannel = releaseChannels[0];

			const res = await uploadFile(worker, user, project.name, devChannel.name);
			expect(res.status).toBe(200);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(true);
			if (json.success === false) {
				throw new Error('Expected success to be true');
			}

			// Confirm build exists
			const builds = await getBuilds<{ dev: Build[] }>(worker, project);
			expect(builds.dev).toBeDefined();
			expect(builds.dev.length).toBe(1);

			const build = builds.dev[0];
			expect(build.buildId).toBe(1);
		});

		test('Can upload multiple builds', async () => {
			const { project, releaseChannels } = await createMockProject(worker, user, undefined, [{ name: 'dev' }]);
			const devChannel = releaseChannels[0];

			const res = await uploadFile(worker, user, project.name, devChannel.name);
			expect(res.status).toBe(200);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(true);
			if (json.success === false) {
				throw new Error('Expected success to be true');
			}

			// Confirm build exists
			const builds = await getBuilds<{ dev: Build[] }>(worker, project);
			expect(builds.dev).toBeDefined();
			expect(builds.dev.length).toBe(1);

			const build = builds.dev[0];
			expect(build.buildId).toBe(1);

			// Upload second build
			const secondRes = await uploadFile(worker, user, project.name, devChannel.name);
			expect(secondRes.status).toBe(200);

			const secondJson = await secondRes.json() as ApiResponse;
			expect(secondJson.success).toBe(true);
			if (secondJson.success === false) {
				throw new Error('Expected success to be true');
			}

			// Confirm build exists
			const builds2 = await getBuilds<{ dev: Build[] }>(worker, project);
			expect(builds2.dev).toBeDefined();
			expect(builds2.dev.length).toBe(2);

			// Builds are newest first
			const newBuild = builds2.dev[0];
			expect(newBuild.buildId).toBe(2);

			const oldBuild = builds2.dev[1];
			expect(oldBuild.buildId).toBe(1);
		});

		test('Can upload to multiple channels', async () => {
			const { project, releaseChannels } = await createMockProject(
				worker,
				user,
				undefined,
				[{ name: 'dev' }, { name: 'release' }],
			);
			const devChannel = releaseChannels[0];
			const releaseChannel = releaseChannels[1];

			// ---- Upload to dev channel ----
			// Test uploads to dev channel
			const res = await uploadFile(worker, user, project.name, devChannel.name);
			expect(res.status).toBe(200);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(true);
			if (json.success === false) {
				throw new Error('Expected success to be true');
			}

			// Confirm build exists
			let builds = await getBuilds<{ dev: Build[], release: Build[] }>(worker, project);
			expect(builds.dev).toBeDefined();
			expect(builds.dev.length).toBe(1);

			const build = builds.dev[0];
			expect(build.buildId).toBe(1);

			// Upload second build
			const secondRes = await uploadFile(worker, user, project.name, devChannel.name);
			expect(secondRes.status).toBe(200);

			const secondJson = await secondRes.json() as ApiResponse;
			expect(secondJson.success).toBe(true);
			if (secondJson.success === false) {
				throw new Error('Expected success to be true');
			}

			// Confirm build exists
			builds = await getBuilds<{ dev: Build[], release: Build[] }>(worker, project);
			expect(builds.dev).toBeDefined();
			expect(builds.dev.length).toBe(2);

			// Builds are newest first
			const newBuild = builds.dev[0];
			expect(newBuild.buildId).toBe(2);

			const oldBuild = builds.dev[1];
			expect(oldBuild.buildId).toBe(1);

			// ---- Upload to release channel ----
			// Test uploads to release channel
			const releaseRes = await uploadFile(worker, user, project.name, releaseChannel.name);
			expect(releaseRes.status).toBe(200);

			const releaseJson = await releaseRes.json() as ApiResponse;
			expect(releaseJson.success).toBe(true);
			if (releaseJson.success === false) {
				throw new Error('Expected success to be true');
			}

			// Confirm build exists
			builds = await getBuilds<{ dev: Build[], release: Build[] }>(worker, project);
			expect(builds.release).toBeDefined();
			expect(builds.release.length).toBe(1);

			const releaseBuild = builds.release[0];
			expect(releaseBuild.buildId).toBe(1);

			// Upload second build
			const secondReleaseRes = await uploadFile(worker, user, project.name, releaseChannel.name);
			expect(secondReleaseRes.status).toBe(200);

			const secondReleaseJson = await secondReleaseRes.json() as ApiResponse;
			expect(secondReleaseJson.success).toBe(true);
			if (secondReleaseJson.success === false) {
				throw new Error('Expected success to be true');
			}

			// Confirm build exists
			builds = await getBuilds<{ dev: Build[], release: Build[] }>(worker, project);
			expect(builds.release).toBeDefined();
			expect(builds.release.length).toBe(2);

			// Builds are newest first
			const newReleaseBuild = builds.release[0];
			expect(newReleaseBuild.buildId).toBe(2);

			const oldReleaseBuild = builds.release[1];
			expect(oldReleaseBuild.buildId).toBe(1);
		});
	});
});

interface UploadOptions {
	blob?: Blob;
	fileName?: string;
	metadata?: UploadMetadata;
}

async function uploadFile(
	worker: UnstableDevWorker,
	user: User,
	projectName: string,
	releaseChannel: string,
	opts?: UploadOptions,
	jarOpts?: MockJarOptions,
) {
	const mockJarFile = await createMockJarFile(jarOpts);

	const blob = opts?.blob ?? mockJarFile.blob;
	const checksum = opts?.metadata.checksum ?? mockJarFile.hash;
	const fileName = opts?.fileName ?? 'test.jar';

	if (!opts?.metadata?.checksum) {
		opts = {
			...opts,
			metadata: {
				...opts?.metadata,
				checksum,
			},
		};
	}

	const formData = new FormData();
	formData.append('file', blob, fileName);
	formData.append('metadata', JSON.stringify(opts.metadata));

	return worker.fetch(`https://worker.local/api/builds/${projectName}/${releaseChannel}/upload`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${user.apiToken}`,
		},
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		body: formData,
	});
}

async function getBuilds<T>(worker: UnstableDevWorker, project: Project) {
	const buildsRes = await worker.fetch(`https://worker.local/api/builds/${project.name}`);
	expect(buildsRes.status).toBe(200);

	const buildsJson = await buildsRes.json() as ApiResponse;

	expect(buildsJson.success).toBe(true);
	if (buildsJson.success === false) {
		throw new Error('Expected success to be true');
	}

	const builds = buildsJson.data as T;
	return builds;
}
