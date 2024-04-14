import { applyD1Migrations, env } from 'cloudflare:test';
import {
	TestRequest,
	createNewProjectRequest,
	createUpdateProjectRcRequest,
	createUpdateProjectRequest,
	createUpdateProjectSettingsRequest,
} from 'tests/testutils/request';
import {
	createAuth,
	createProject,
	createUser,
	init,
} from 'tests/testutils/seed';
import { describe, test, expect, beforeEach } from 'vitest';
import * as errors from '~/api/errors';
import { NewProjectResponse } from '~/handlers/projects/project';
import ProjectSettingStore from '~/store/ProjectSettingStore';
import { ProjectSettings, ReleaseChannel } from '~/store/schema';

describe('/api/projects', () => {
	beforeEach(async () => {
		await applyD1Migrations(env.DB, env.MIGRATIONS);
	});

	describe('GET /', () => {
		test('Can get projects', async () => {
			const userOne = await createUser(env);
			const userTwo = await createUser(env);

			const projectOne = await createProject(env, userOne);
			const projectTwo = await createProject(env, userOne);
			const projectThree = await createProject(env, userTwo);

			const res = await TestRequest.new('/api/projects').run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<ProjectResponse[]>();
			expect(data).toHaveLength(3);

			expect(data[0].name).toBe(projectOne.name);
			expect(data[1].name).toBe(projectTwo.name);
			expect(data[2].name).toBe(projectThree.name);
		});

		test('Projects with different default RCs return the correct RC', async () => {
			const userOne = await createUser(env);
			const userTwo = await createUser(env);

			const projectOne = await createProject(env, userOne);
			const projectTwo = await createProject(env, userOne, undefined, { name: 'Heyo' });
			const projectThree = await createProject(env, userTwo, undefined, { name: 'Test' });

			const res = await TestRequest.new('/api/projects').run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<ProjectResponse[]>();
			expect(data).toHaveLength(3);

			// Default RC
			expect(data[0].name).toBe(projectOne.name);

			// Custom
			expect(data[1].name).toBe(projectTwo.name);
			expect(data[1].defaultReleaseChannel?.name).toBe('Heyo');

			expect(data[2].name).toBe(projectThree.name);
			expect(data[2].defaultReleaseChannel?.name).toBe('Test');
		});

		test('No projects returns an empty array', async () => {
			const res = await TestRequest.new('/api/projects').run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<ProjectResponse[]>();
			expect(data).toHaveLength(0);
		});
	});

	describe('GET /:projectName', () => {
		test('Can get project', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user);

			const res = await TestRequest.new(`/api/projects/${project.name}`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<ProjectResponse>();
			expect(data.name).toBe(project.name);

			expect(data.defaultReleaseChannel).toBeDefined();
			expect(data.defaultReleaseChannel?.name).toBe('Dev');
		});

		test('Project not found', async () => {
			const res = await TestRequest.new('/api/projects/does-not-exist').run();
			res.expectStatus(404);
			res.expectFailure();
			res.expectError(errors.ProjectNotFound);
		});

		test('Can get project with custom RC', async () => {
			const user = await createUser(env);
			const project = await createProject(env, user, undefined, { name: 'Test' });

			const res = await TestRequest.new(`/api/projects/${project.name}`).run();
			res.expectStatus(200);
			res.expectSuccessful();
			res.expectData();

			const data = res.getData<ProjectResponse>();
			expect(data.name).toBe(project.name);

			expect(data.defaultReleaseChannel).toBeDefined();
			expect(data.defaultReleaseChannel?.name).toBe('Test');
		});
	});

	describe('PATCH /:projectName', async () => {
		describe('Happy path', () => {
			test('Can update project', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user, {
					name: 'Test-project',
					description: 'A test project',
				});

				// Validate non-edited project
				const currentRes = await TestRequest.new(`/api/projects/${project.name}`).run();
				currentRes.expectStatus(200);
				currentRes.expectSuccessful();
				currentRes.expectData();

				const currentData = currentRes.getData<ProjectResponse>();
				expect(currentData.name).toBe('Test-project');
				expect(currentData.description).toBe('A test project');
				expect(currentData.repoLink).toBeNull();
				expect(currentData.wikiLink).toBeNull();

				// Update project
				const res = await createUpdateProjectRequest(auth, project, {
					name: 'Updated-name',
					description: 'Updated description',
					repoLink: 'https://github.com/WalshyDev/blob-builds',
					wikiLink: 'https://blob.build/docs',
				}).run();
				res.expectStatus(200);
				res.expectSuccessful();
				res.expectData();

				const data = res.getData<ProjectResponse>();
				expect(data.name).toBe('Updated-name');
				expect(data.description).toBe('Updated description');
				expect(data.repoLink).toBe('https://github.com/WalshyDev/blob-builds');
				expect(data.wikiLink).toBe('https://blob.build/docs');
			});
		});

		describe('Validation', () => {
			test('Auth is required', async () => {
				const user = await createUser(env);
				const project = await createProject(env, user);

				const res = await TestRequest.new(`/api/projects/${project.name}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: 'Updated-name',
						description: 'Updated description',
					}),
				}).run();
				res.expectStatus(401);
				res.expectFailure();
				res.expectError(errors.NoAuthentication);
			});

			test('Cannot update project for another user', async () => {
				const userOne = await createUser(env);
				const userTwo = await createUser(env);
				const userTwoAuth = await createAuth(userTwo);

				const project = await createProject(env, userOne);

				// Try to update the project as user two
				const res = await createUpdateProjectRequest(userTwoAuth, project, {
					name: 'Updated-name',
					description: 'Updated description',
				}).run();
				res.expectStatus(404);
				res.expectFailure();
				res.expectError(errors.ProjectNotFound);
			});

			test('Trying to update an invalid project fails', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);

				// Update project
				// @ts-expect-error - Testing invalid project
				const res = await createUpdateProjectRequest(auth, { name: 'Abc' }, {
					name: 'Test',
					description: 'Testing 123',
				}).run();
				res.expectStatus(404);
				res.expectFailure();
				res.expectError(errors.ProjectNotFound);
			});

			test('Cannot update with no data', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const res = await createUpdateProjectRequest(auth, project, {}).run();
				res.expectStatus(400);
				res.expectFailure();
				res.expectError(errors.NothingToUpdate);
			});

			describe('Schema validation', () => {
				// Name
				test('Name has to be at least 3 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRequest(auth, project, {
						name: 'Ab',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('name needs to be at least 3 characters'));
				});

				test('Name has to be at most 64 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRequest(auth, project, {
						name: 'a'.repeat(65),
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('name needs to be at most 64 characters'));
				});

				test('Name has to be alphanumeric with only a dash or underscore', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRequest(auth, project, {
						name: 'abc def',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('name needs to be alphanumeric with only a dash or underscore'));
				});

				// Description
				test('Description has to be at least 6 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRequest(auth, project, {
						description: 'Abc',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('description needs to be at least 6 characters'));
				});

				test('Description has to be at most 2000 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRequest(auth, project, {
						description: 'a'.repeat(2001),
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('description needs to be at most 2000 characters'));
				});

				// Repo link
				test('Repo link needs to be a GitHub or GitLab link', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRequest(auth, project, {
						repoLink: 'https://example.com',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('repoLink needs to be a valid GitHub or GitLab repository link'));
				});

				test('Repo link needs to point to a repo', async () => {
					// Point to root
					let user = await createUser(env);
					let auth = await createAuth(user);
					let project = await createProject(env, user);

					let res = await createUpdateProjectRequest(auth, project, {
						repoLink: 'https://github.com',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('repoLink needs to be a valid GitHub or GitLab repository link'));

					// Point to user
					user = await createUser(env);
					auth = await createAuth(user);
					project = await createProject(env, user);

					res = await createUpdateProjectRequest(auth, project, {
						repoLink: 'https://github.com/WalshyDev',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('repoLink needs to be a valid GitHub or GitLab repository link'));

					// Point to invalid repo
					user = await createUser(env);
					auth = await createAuth(user);
					project = await createProject(env, user);

					res = await createUpdateProjectRequest(auth, project, {
						repoLink: 'https://github.com/WalshyDev/Abc%20Def',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('repoLink needs to be a valid GitHub or GitLab repository link'));
				});

				// Wiki link
				test('Wiki link needs a scheme', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRequest(auth, project, {
						wikiLink: 'example.com',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('wikiLink needs to be a valid URL'));
				});

				test('Wiki link cannot be an IP', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRequest(auth, project, {
						wikiLink: '0.0.0.0',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('wikiLink needs to be a valid URL'));
				});

				test('Wiki link cannot be a random string', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRequest(auth, project, {
						wikiLink: 'abc def ghi',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('wikiLink needs to be a valid URL'));
				});
			});
		});
	});

	describe('POST /:projectName/new', () => {
		describe('Happy path', () => {
			test('Can create project', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);

				// @ts-expect-error - release channels default, zod types think it's required
				const res = await createNewProjectRequest(auth, {
					name: 'Test-project',
					description: 'A test project',
				}).run();
				console.log(res.getApiResponse());
				res.expectStatus(200);
				res.expectSuccessful();
				res.expectData();

				const data = res.getData<NewProjectResponse>();
				expect(data.project.name).toBe('Test-project');
				expect(data.project.description).toBe('A test project');

				expect(data.release_channels.length).toBe(1);

				// Validate project exists
				const projectRes = await TestRequest.new(`/api/projects/${data.project.name}`).run();
				projectRes.expectStatus(200);
				projectRes.expectSuccessful();
				projectRes.expectData();

				const projectData = projectRes.getData<ProjectResponse>();
				expect(projectData.name).toBe('Test-project');
				expect(projectData.description).toBe('A test project');

				// Validate a default RC was created
				expect(projectData.defaultReleaseChannel).toBeDefined();
				expect(projectData.defaultReleaseChannel?.name).toBe('Dev');
				expect(projectData.defaultReleaseChannel?.supportedVersions).toBe('Unknown');

				const settings = await init(env, () => ProjectSettingStore.getSettings(data.project.projectId));
				expect(settings).toBeDefined();
				expect(settings?.overwritePluginYml).toBe(true);
			});
		});

		describe('Validation', () => {
			test('Auth is required', async () => {
				const user = await createUser(env);
				const project = await createProject(env, user);

				const res = await TestRequest.new(`/api/projects/${project.name}/new`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: 'Test-project',
						description: 'A test project',
					}),
				}).run();
				res.expectStatus(401);
				res.expectFailure();
				res.expectError(errors.NoAuthentication);
			});

			test('Cannot create a project with the same name', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);

				const project = await createProject(env, user);

				// @ts-expect-error - release channels default, zod types think it's required
				const res = await createNewProjectRequest(auth, {
					name: project.name,
					description: 'A test project',
				}).run();
				res.expectStatus(400);
				res.expectFailure();
				res.expectError(errors.ProjectAlreadyExists);
			});

			test('An RC is required to create project', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);

				const res = await createNewProjectRequest(auth, {
					name: 'Test-project',
					description: 'Testing 123',
					releaseChannels: [],
				}).run();
				res.expectStatus(400);
				res.expectFailure();
				res.expectError(errors.NoReleaseChannels);
			});

			describe('Schema validation', () => {
				// Name
				test('Name has to be at least 3 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					// @ts-expect-error - release channels default, zod types think it's required
					const res = await createNewProjectRequest(auth, {
						name: 'Ab',
						description: 'Testing 123',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('name needs to be at least 3 characters'));
				});

				test('Name has to be at most 64 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					// @ts-expect-error - release channels default, zod types think it's required
					const res = await createNewProjectRequest(auth, {
						name: 'a'.repeat(65),
						description: 'Testing 123',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('name needs to be at most 64 characters'));
				});

				test('Name has to be alphanumeric with only a dash or underscore', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					// @ts-expect-error - release channels default, zod types think it's required
					const res = await createNewProjectRequest(auth, {
						name: 'abc def',
						description: 'Testing 123',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('name needs to be alphanumeric with only a dash or underscore'));
				});

				// Description
				test('Description has to be at least 6 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					// @ts-expect-error - release channels default, zod types think it's required
					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Abc',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('description needs to be at least 6 characters'));
				});

				test('Description has to be at most 2000 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					// @ts-expect-error - release channels default, zod types think it's required
					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'a'.repeat(2001),
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('description needs to be at most 2000 characters'));
				});

				// Repo link
				test('Repo link needs to be a GitHub or GitLab link', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					// @ts-expect-error - release channels default, zod types think it's required
					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						repoLink: 'https://example.com',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('repoLink needs to be a valid GitHub or GitLab repository link'));
				});

				test('Repo link needs to point to a repo', async () => {
					// Point to root
					const user = await createUser(env);
					const auth = await createAuth(user);

					// @ts-expect-error - release channels default, zod types think it's required
					let res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						repoLink: 'https://github.com',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('repoLink needs to be a valid GitHub or GitLab repository link'));

					// Point to user
					// @ts-expect-error - release channels default, zod types think it's required
					res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						repoLink: 'https://github.com/WalshyDev',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('repoLink needs to be a valid GitHub or GitLab repository link'));

					// Point to invalid repo
					// @ts-expect-error - release channels default, zod types think it's required
					res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						repoLink: 'https://github.com/WalshyDev/Abc%20Def',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('repoLink needs to be a valid GitHub or GitLab repository link'));
				});

				// Wiki link
				test('Wiki link needs a scheme', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					// @ts-expect-error - release channels default, zod types think it's required
					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						wikiLink: 'example.com',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('wikiLink needs to be a valid URL'));
				});

				test('Wiki link cannot be an IP', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					// @ts-expect-error - release channels default, zod types think it's required
					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						wikiLink: '0.0.0.0',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('wikiLink needs to be a valid URL'));
				});

				test('Wiki link cannot be a random string', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					// @ts-expect-error - release channels default, zod types think it's required
					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						wikiLink: 'abc def ghi',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('wikiLink needs to be a valid URL'));
				});

				// Release channels
				// Name
				test('RC name has to be at least 3 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						releaseChannels: [{ name: 'Ab', supportedVersions: '1.0+', dependencies: [], fileNaming: '$project.jar' }],
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('name needs to be at least 3 characters'));
				});

				test('RC name has to be at most 64 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						releaseChannels: [{
							name: 'a'.repeat(65),
							supportedVersions: '1.0+',
							dependencies: [],
							fileNaming: '$project.jar',
						}],
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('name needs to be at most 64 characters'));
				});

				test('RC name has to be alphanumeric with only a dash or underscore', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						releaseChannels: [{
							name: 'abc def',
							supportedVersions: '1.0+',
							dependencies: [],
							fileNaming: '$project.jar',
						}],
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('name needs to be alphanumeric with only a dash or underscore'));
				});

				// Supported versions
				test('Supported versions has to be at least 1 character', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						releaseChannels: [{ name: 'Test', supportedVersions: '', dependencies: [], fileNaming: '$project.jar' }],
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('supportedVersions needs to be at least 1 character'));
				});

				test('Supported versions has to be at most 20 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						releaseChannels: [{
							name: 'Test',
							supportedVersions: 'a'.repeat(21),
							dependencies: [],
							fileNaming: '$project.jar',
						}],
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('supportedVersions needs to be at most 20 characters'));
				});

				// Dependencies
				test('Dependencies has to be an array', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						releaseChannels: [{
							name: 'Test',
							supportedVersions: '1.0+',
							// @ts-expect-error - Testing invalid type
							dependencies: 'abc',
							fileNaming: '$project.jar',
						}],
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('Expected array, received string'));
				});

				test('Dependencies has to be at most 10 items', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						releaseChannels: [{
							name: 'Test',
							supportedVersions: '1.0+',
							dependencies: Array.from({ length: 11 }, () => 'abc'),
							fileNaming: '$project.jar',
						}],
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('dependencies needs to be at most 10 items'));
				});

				test('Dependency names have to be at least 1 character', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						releaseChannels: [{
							name: 'Test',
							supportedVersions: '1.0+',
							dependencies: [''],
							fileNaming: '$project.jar',
						}],
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('dependency needs to be at least 1 character'));
				});

				test('Dependency names have to be at most 64 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						releaseChannels: [{
							name: 'Test',
							supportedVersions: '1.0+',
							dependencies: ['a'.repeat(65)],
							fileNaming: '$project.jar',
						}],
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('dependency needs to be at most 64 characters'));
				});

				// File naming
				test('File naming has to be at least 3 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						releaseChannels: [{ name: 'Test', supportedVersions: '1.0+', dependencies: [], fileNaming: 'Ab' }],
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('fileNaming needs to be at least 3 characters'));
				});

				test('File naming has to be at most 64 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);

					const res = await createNewProjectRequest(auth, {
						name: 'Test-project',
						description: 'Testing 123',
						releaseChannels: [{
							name: 'Test',
							supportedVersions: '1.0+',
							dependencies: [],
							fileNaming: 'a'.repeat(65),
						}],
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('fileNaming needs to be at most 64 characters'));
				});
			});
		});
	});

	describe('PATCH /:projectName/settings', () => {
		describe('Happy path', () => {
			test('Can update project settings', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				// TODO: Make endpoint for getting settings
				// Validate non-edited project
				const settings = await init(env, () => ProjectSettingStore.getSettings(project.projectId));
				expect(settings).toBeDefined();
				expect(settings?.overwritePluginYml).toBe(true);

				// Update project
				const res = await createUpdateProjectSettingsRequest(auth, project, { overwritePluginYml: false }).run();
				console.log(res.getApiResponse());
				res.expectStatus(200);
				res.expectSuccessful();
				res.expectData();

				const data = res.getData<ProjectSettings>();
				expect(data.overwritePluginYml).toBe(false);
			});
		});

		describe('Validation', () => {
			test('Auth is required', async () => {
				const user = await createUser(env);
				const project = await createProject(env, user);

				const res = await TestRequest.new(`/api/projects/${project.name}/settings`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						overwritePluginYml: false,
					}),
				}).run();
				res.expectStatus(401);
				res.expectFailure();
				res.expectError(errors.NoAuthentication);
			});

			test('Cannot update project for another user', async () => {
				const userOne = await createUser(env);
				const userTwo = await createUser(env);
				const userTwoAuth = await createAuth(userTwo);

				const project = await createProject(env, userOne);

				// Try to update the project as user two
				const res = await createUpdateProjectSettingsRequest(userTwoAuth, project, {
					overwritePluginYml: false,
				}).run();
				res.expectStatus(404);
				res.expectFailure();
				res.expectError(errors.ProjectNotFound);
			});

			test('Trying to update an invalid project fails', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);

				// Update project
				// @ts-expect-error - Testing invalid project
				const res = await createUpdateProjectSettingsRequest(auth, { name: 'Abc' }, {
					overwritePluginYml: false,
				}).run();
				res.expectStatus(404);
				res.expectFailure();
				res.expectError(errors.ProjectNotFound);
			});

			test('Cannot update with no data', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const res = await createUpdateProjectSettingsRequest(auth, project, {}).run();
				res.expectStatus(400);
				res.expectFailure();
				res.expectError(errors.NothingToUpdate);
			});

			describe('Schema validation', () => {
				test('overwritePluginYml has to be a boolean', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectSettingsRequest(auth, project, {
						// @ts-expect-error - Testing invalid type
						overwritePluginYml: 'abc',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('overwritePluginYml needs to be a boolean'));
				});
			});
		});
	});

	describe('PATCH /:projectName/:releaseChannel', () => {
		describe('Happy path', () => {
			test('Can update project RC', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user, undefined, {
					name: 'RC',
					supportedVersions: '1.0+',
					dependencies: ['Earth'],
					fileNaming: '$project-beta.jar',
				});

				// Validate non-edited project
				const currentRes = await TestRequest.new(`/api/projects/${project.name}`).run();
				currentRes.expectStatus(200);
				currentRes.expectSuccessful();
				currentRes.expectData();

				const currentData = currentRes.getData<ProjectResponse>();
				expect(currentData.defaultReleaseChannel?.name).toBe('RC');
				expect(currentData.defaultReleaseChannel?.supportedVersions).toBe('1.0+');
				expect(currentData.defaultReleaseChannel?.dependencies).toEqual(['Earth']);
				expect(currentData.defaultReleaseChannel?.fileNaming).toBe('$project-beta.jar');

				const res = await createUpdateProjectRcRequest(auth, project, 'RC', {
					name: 'Updated-RC',
					supportedVersions: '1.1+',
					dependencies: ['Mars'],
					fileNaming: '$project-$version.jar',
				}).run();
				res.expectStatus(200);
				res.expectSuccessful();
				res.expectData();

				const data = res.getData<ReleaseChannel>();
				expect(data.name).toBe('Updated-RC');
				expect(data.supportedVersions).toBe('1.1+');
				expect(data.dependencies).toEqual(['Mars']);
				expect(data.fileNaming).toBe('$project-$version.jar');
			});
		});

		describe('Validation', async () => {
			test('Auth is required', async () => {
				const user = await createUser(env);
				const project = await createProject(env, user);

				const res = await TestRequest.new(`/api/projects/${project.name}/Dev`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: 'Updated-name',
					}),
				}).run();
				res.expectStatus(401);
				res.expectFailure();
				res.expectError(errors.NoAuthentication);
			});

			test('Cannot update project for another user', async () => {
				const userOne = await createUser(env);
				const userTwo = await createUser(env);
				const userTwoAuth = await createAuth(userTwo);

				const project = await createProject(env, userOne);

				// Try to update the project as user two
				const res = await createUpdateProjectRcRequest(userTwoAuth, project, 'Dev', {
					name: 'Updated-name',
				}).run();
				res.expectStatus(404);
				res.expectFailure();
				res.expectError(errors.ProjectNotFound);
			});

			test('Trying to update an invalid project fails', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);

				// @ts-expect-error - Testing invalid project
				const res = await createUpdateProjectRcRequest(auth, { name: 'Abc' }, 'Dev', {
					name: 'Test',
				}).run();
				res.expectStatus(404);
				res.expectFailure();
				res.expectError(errors.ProjectNotFound);
			});

			test('Trying to update an invalid rc fails', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const res = await createUpdateProjectRcRequest(auth, project, 'Testing', {
					name: 'Test',
				}).run();
				res.expectStatus(404);
				res.expectFailure();
				res.expectError(errors.ReleaseChannelNotFound);
			});

			test('Cannot update with no data', async () => {
				const user = await createUser(env);
				const auth = await createAuth(user);
				const project = await createProject(env, user);

				const res = await createUpdateProjectRcRequest(auth, project, 'Dev', {}).run();
				res.expectStatus(400);
				res.expectFailure();
				res.expectError(errors.NothingToUpdate);
			});

			describe('Schema validation', () => {
				// Name
				test('Name has to be at least 3 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRcRequest(auth, project, 'Dev', {
						name: 'Ab',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('name needs to be at least 3 characters'));
				});

				test('Name has to be at most 64 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRcRequest(auth, project, 'Dev', {
						name: 'a'.repeat(65),
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('name needs to be at most 64 characters'));
				});

				test('Name has to be alphanumeric with only a dash or underscore', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRcRequest(auth, project, 'Dev', {
						name: 'abc def',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('name needs to be alphanumeric with only a dash or underscore'));
				});

				// Supported versions
				test('Supported versions has to be at least 1 character', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRcRequest(auth, project, 'Dev', {
						supportedVersions: '',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('supportedVersions needs to be at least 1 character'));
				});

				test('Supported versions has to be at most 20 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRcRequest(auth, project, 'Dev', {
						supportedVersions: 'a'.repeat(21),
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('supportedVersions needs to be at most 20 characters'));
				});

				// Dependencies
				test('Dependencies cannot be empty strings', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRcRequest(auth, project, 'Dev', {
						dependencies: [''],
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('dependency needs to be at least 1 character'));
				});

				test('Dependencies cannot be longer than 64 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRcRequest(auth, project, 'Dev', {
						dependencies: ['a'.repeat(65)],
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('dependency needs to be at most 64 characters'));
				});

				test('Must have 10 or less dependencies', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRcRequest(auth, project, 'Dev', {
						dependencies: Array.from({ length: 11 }, () => 'a'),
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('dependencies needs to be at most 10 items'));
				});

				// File naming
				test('File naming has to be at least 3 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRcRequest(auth, project, 'Dev', {
						fileNaming: 'Ab',
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('fileNaming needs to be at least 3 characters'));
				});

				test('File naming has to be at most 64 characters', async () => {
					const user = await createUser(env);
					const auth = await createAuth(user);
					const project = await createProject(env, user);

					const res = await createUpdateProjectRcRequest(auth, project, 'Dev', {
						fileNaming: 'a'.repeat(65),
					}).run();
					res.expectStatus(400);
					res.expectFailure();
					res.expectError(errors.InvalidJson('fileNaming needs to be at most 64 characters'));
				});
			});
		});
	});
});
