import { createMockJarFile, createMockProject, createMockUser, setupWorker } from 'tests/testutils/test';
import { describe, test, expect, beforeAll } from 'vitest';
import { UnstableDevWorker } from 'wrangler';
import * as errors from '~/api/errors';
import { Build, Project, ReleaseChannel, User } from '~/store/schema';

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
					// @ts-expect-error - unstable_dev doesn't use workers-types
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
					// @ts-expect-error - unstable_dev doesn't use workers-types
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
					// @ts-expect-error - unstable_dev doesn't use workers-types
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
					// @ts-expect-error - unstable_dev doesn't use workers-types
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
					// @ts-expect-error - unstable_dev doesn't use workers-types
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
					// @ts-expect-error - unstable_dev doesn't use workers-types
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

		// TODO: Plugin.yml testing
	});
});

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

	test('Can upload', async () => {
		const res = await uploadFile(worker, user, project.name, devReleaseChannel.name);
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

interface UploadOptions {
	blob?: Blob;
	fileName?: string;
	checksum?: string;
}

async function uploadFile(
	worker: UnstableDevWorker,
	user: User,
	projectName: string,
	releaseChannel: string,
	opts?: UploadOptions,
) {
	const mockJarFile = await createMockJarFile();

	const blob = opts?.blob ?? mockJarFile.blob;
	const checksum = opts?.checksum ?? '9cd3aad23d91918404f0c619a4bbe92afbebc78288006d4ffe5ae12e97155df8';
	const fileName = opts?.fileName ?? 'test.jar';

	const formData = new FormData();
	formData.append('file', blob, fileName);
	formData.append('metadata', JSON.stringify({
		checksum,
	}));

	return worker.fetch(`https://worker.local/api/builds/${projectName}/${releaseChannel}/upload`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${user.apiToken}`,
		},
		// @ts-expect-error - unstable_dev doesn't use workers-types
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
