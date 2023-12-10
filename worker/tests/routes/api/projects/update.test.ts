import JSZip from 'jszip';
import {
	createMockProject,
	createMockUser,
	setupWorker,
} from 'tests/testutils/test';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { UnstableDevWorker } from 'wrangler';
import * as errors from '~/api/errors';
import { Build, InsertProject, Project, ReleaseChannel, User } from '~/store/schema';

describe('Test updating project', () => {
	let worker: UnstableDevWorker;
	let user: User;

	beforeAll(async () => {
		worker = await setupWorker();

		user = await createMockUser(worker);
	});

	afterAll(async () => {
		await worker.stop();
	});

	function updateProject(projectName: string, project: Partial<InsertProject>) {
		return worker.fetch(`/api/projects/${projectName}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${user.apiToken}`,
			},
			body: JSON.stringify(project),
		});
	}

	describe('Test auth', () => {
		test('Fail without auth', async () => {
			const { project } = await createMockProject(worker, user);

			const res = await worker.fetch(`/api/projects/${project.name}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({}),
			});

			expect(res.status).toBe(401);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidAuthHeader.getCode());
			expect(json.error).toBe(errors.InvalidAuthHeader.getErrorMessage());
		});

		test('Cannot update project for other user', async () => {
			const userTwo = await createMockUser(worker);
			const { project } = await createMockProject(worker, userTwo);

			const res = await updateProject(project.name, {
				description: 'This is not my project',
			});

			expect(res.status).toBe(404);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.ProjectNotFound.getCode());
			expect(json.error).toBe(errors.ProjectNotFound.getErrorMessage());
		});
	});
});
