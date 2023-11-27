import { createMockJarFile, createMockProject, createMockUser, setupWorker } from 'tests/testutils/test';
import { describe, test, expect, beforeAll } from 'vitest';
import { UnstableDevWorker } from 'wrangler';
import * as errors from '~/api/errors';
import { Project, ReleaseChannel, User } from '~/store/schema';

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

	test('Can upload', async () => {
		const jarFile = await createMockJarFile();

		const formData = new FormData();
		formData.append('file', jarFile.blob, 'test.jar');
		formData.append('metadata', JSON.stringify({
			checksum: '9cd3aad23d91918404f0c619a4bbe92afbebc78288006d4ffe5ae12e97155df8',
		}));

		const res = await worker.fetch(`https://worker.local/api/builds/${project.name}/${devReleaseChannel.name}/upload`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${user.apiToken}`,
			},
			// @ts-expect-error - unstable_dev doesn't use workers-types
			body: formData,
		});

		expect(res.status).toBe(200);

		const json = await res.json() as ApiResponse;
		expect(json.success).toBe(true);
		if (json.success === false) {
			throw new Error('Expected success to be true');
		}
	});
});
