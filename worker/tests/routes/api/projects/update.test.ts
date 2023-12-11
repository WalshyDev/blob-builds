import {
	createMockProject,
	createMockUser,
	setupWorker,
} from 'tests/testutils/test';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { UnstableDevWorker } from 'wrangler';
import * as errors from '~/api/errors';
import { InsertProject, Project, User } from '~/store/schema';

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

	describe('Test validation', () => {
		test('Cannot update project with json array', async () => {
			const { project } = await createMockProject(worker, user);

			const res = await worker.fetch(`/api/projects/${project.name}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${user.apiToken}`,
				},
				body: '["abc"]',
			});

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidJson('').getCode());
			expect(json.error).toBe(errors.InvalidJson('Expected object, received array').getErrorMessage());
		});

		// Project name
		test('Test project name too short', async () => {
			const { project } = await createMockProject(worker, user);

			const res = await updateProject(project.name, {
				name: 'a',
			});

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidJson('').getCode());
			expect(json.error).toBe(errors
				.InvalidJson('name needs to be at least 3 characters')
				.getErrorMessage(),
			);
		});

		test('Test project name too long', async () => {
			const { project } = await createMockProject(worker, user);

			const res = await updateProject(project.name, {
				name: 'a'.repeat(65),
			});

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidJson('').getCode());
			expect(json.error).toBe(errors
				.InvalidJson('name needs to be at most 64 characters')
				.getErrorMessage(),
			);
		});

		test('Test invalid project name', async () => {
			const { project } = await createMockProject(worker, user);

			const res = await updateProject(project.name, {
				name: 'abc def',
			});

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidJson('').getCode());
			expect(json.error).toBe(errors
				.InvalidJson('name needs to be alphanumeric with only a dash or underscore')
				.getErrorMessage(),
			);
		});

		// Description
		test('Test description too short', async () => {
			const { project } = await createMockProject(worker, user);

			const res = await updateProject(project.name, {
				description: 'abc',
			});

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidJson('').getCode());
			expect(json.error).toBe(errors
				.InvalidJson('description needs to be at least 6 characters')
				.getErrorMessage(),
			);
		});

		test('Test description too long', async () => {
			const { project } = await createMockProject(worker, user);

			const res = await updateProject(project.name, {
				description: 'a'.repeat(2001),
			});

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidJson('').getCode());
			expect(json.error).toBe(errors
				.InvalidJson('description needs to be at most 2000 characters')
				.getErrorMessage(),
			);
		});

		// repoLink
		test('Test repoLink is a URL', async () => {
			const { project } = await createMockProject(worker, user);

			const res = await updateProject(project.name, {
				repoLink: 'google.com',
			});

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidJson('').getCode());
			expect(json.error).toBe(errors.InvalidJson('Invalid url').getErrorMessage(),
			);
		});

		test('Test repoLink is not GitHub/GitLab', async () => {
			const { project } = await createMockProject(worker, user);

			const res = await updateProject(project.name, {
				repoLink: 'https://git.com/Abc/Def',
			});

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidJson('').getCode());
			expect(json.error).toBe(errors
				.InvalidJson('repoLink needs to be a valid GitHub or GitLab repository link')
				.getErrorMessage(),
			);
		});

		test('Test repoLink is not GitHub user', async () => {
			const { project } = await createMockProject(worker, user);

			const res = await updateProject(project.name, {
				repoLink: 'https://github.com/Abc',
			});

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidJson('').getCode());
			expect(json.error).toBe(errors
				.InvalidJson('repoLink needs to be a valid GitHub or GitLab repository link')
				.getErrorMessage(),
			);
		});

		test('Test repoLink is not GitHub user', async () => {
			const { project } = await createMockProject(worker, user);

			const res = await updateProject(project.name, {
				repoLink: 'https://gitlab.com/Abc',
			});

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.InvalidJson('').getCode());
			expect(json.error).toBe(errors
				.InvalidJson('repoLink needs to be a valid GitHub or GitLab repository link')
				.getErrorMessage(),
			);
		});
	});

	describe('Test updating project', async () => {
		test('Cannot update project ID', async () => {
			const { project } = await createMockProject(worker, user);
			const res = await updateProject(project.name, {
				projectId: 0,
			});

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.NothingToUpdate.getCode());
			expect(json.error).toBe(errors.NothingToUpdate.getErrorMessage());
		});

		test('Cannot update user ID', async () => {
			const { project } = await createMockProject(worker, user);
			const res = await updateProject(project.name, {
				userId: 0,
			});

			expect(res.status).toBe(400);

			const json = await res.json() as ApiResponse;
			expect(json.success).toBe(false);
			if (json.success === true) {
				throw new Error('Expected success to be false');
			}

			expect(json.code).toBe(errors.NothingToUpdate.getCode());
			expect(json.error).toBe(errors.NothingToUpdate.getErrorMessage());
		});

		test('Update project name', async () => {
			const { project } = await createMockProject(worker, user);
			const res = await updateProject(project.name, {
				name: 'new-name',
			});

			expect(res.status).toBe(200);

			const json = await res.json() as ApiResponse<Project>;
			expect(json.success).toBe(true);
			if (json.success === false) {
				throw new Error('Expected success to be true');
			}

			expect(json.data).toBeDefined();
			expect(json.data.name).toBe('new-name');
		});

		test('Update description', async () => {
			const { project } = await createMockProject(worker, user);
			const res = await updateProject(project.name, {
				description: 'My new description',
			});

			expect(res.status).toBe(200);

			const json = await res.json() as ApiResponse<Project>;
			expect(json.success).toBe(true);
			if (json.success === false) {
				throw new Error('Expected success to be true');
			}

			expect(json.data).toBeDefined();
			expect(json.data.description).toBe('My new description');
		});

		test('Update repoLink (GitHub)', async () => {
			const { project } = await createMockProject(worker, user);
			const res = await updateProject(project.name, {
				repoLink: 'https://github.com/Example/Example',
			});

			expect(res.status).toBe(200);

			const json = await res.json() as ApiResponse<Project>;
			expect(json.success).toBe(true);
			if (json.success === false) {
				throw new Error('Expected success to be true');
			}

			expect(json.data).toBeDefined();
			expect(json.data.repoLink).toBe('https://github.com/Example/Example');
		});

		test('Update repoLink (GitLab)', async () => {
			const { project } = await createMockProject(worker, user);
			const res = await updateProject(project.name, {
				repoLink: 'https://gitlab.com/Example/Example',
			});

			expect(res.status).toBe(200);

			const json = await res.json() as ApiResponse<Project>;
			expect(json.success).toBe(true);
			if (json.success === false) {
				throw new Error('Expected success to be true');
			}

			expect(json.data).toBeDefined();
			expect(json.data.repoLink).toBe('https://gitlab.com/Example/Example');
		});
	});
});
