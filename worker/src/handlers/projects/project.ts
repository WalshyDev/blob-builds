import { Context } from 'hono';
import { z } from 'zod';
import { success } from '~/api/api';
import * as errors from '~/api/errors';
import { toProjectResponse } from '~/api/response';
import ProjectSettingStore from '~/store/ProjectSettingStore';
import ProjectStore from '~/store/ProjectStore';
import ReleaseChannelStore from '~/store/ReleaseChannelStore';
import { InsertReleaseChannel, Project, ReleaseChannel } from '~/store/schema';
import { Ctx } from '~/types/hono';

// GET /api/projects
export async function getProjects() {
	const projects = await ProjectStore.getProjects();

	const projectResponses: ProjectResponse[] = [];
	for (const project of projects) {
		projectResponses.push(toProjectResponse(project, project.defaultReleaseChannel));
	}

	return success('Success', projectResponses);
}

// GET /api/projects/:projectName
export async function getProject(ctx: Context) {
	const projectName = ctx.req.param('projectName');

	const project = await ProjectStore.getProjectByName(projectName);
	if (project === undefined) {
		return errors.ProjectNotFound.toResponse(ctx);
	}

	const defaultReleaseChannel = project.defaultReleaseChannel;
	let releaseChannel: ReleaseChannel | undefined;
	if (defaultReleaseChannel !== null) {
		releaseChannel = await ReleaseChannelStore.getReleaseChannelById(defaultReleaseChannel);
	}

	return success('Success', toProjectResponse(project, releaseChannel));
}

export const patchProjectSchema: z.ZodType<Partial<Omit<Project, 'userId' | 'projectId'>>> = z.object({
	name: z.string()
		.min(3, 'name needs to be at least 3 characters')
		.max(64, 'name needs to be at most 64 characters')
		.regex(/^[a-zA-Z0-9_-]+$/, 'name needs to be alphanumeric with only a dash or underscore')
		.optional(),
	description: z.string()
		.min(6, 'description needs to be at least 6 characters')
		.max(2000, 'description needs to be at most 2000 characters')
		.optional(),
	repoLink: z.string()
		.url()
		.regex(
			/^https:\/\/(github|gitlab).com\/[a-zA-Z0-9_-]{1,64}\/[a-zA-Z0-9_-]{1,64}$/,
			'repoLink needs to be a valid GitHub or GitLab repository link',
		)
		.optional(),
	wikiLink: z.string()
		.url('wikiLink needs to be a valid URL')
		.optional(),
});

export type PatchProjectBody = z.infer<typeof patchProjectSchema>;

// PATCH /api/projects/:projectName
export async function patchProject(ctx: Ctx, body: PatchProjectBody) {
	const userId = ctx.get('userId');
	const projectName = ctx.req.param('projectName');

	if (Object.keys(body).length === 0) {
		return errors.NothingToUpdate.toResponse(ctx);
	}

	// Get project
	const project = await ProjectStore.getProjectByNameAndUser(projectName, userId);
	if (project === undefined) {
		return errors.ProjectNotFound.toResponse(ctx);
	}

	// Update project
	const updatedProject = await ProjectStore.updateProject(project.projectId, body);

	return success('Project updated!', updatedProject);
}

export const newProjectSchema = z.object({
	name: z.string()
		.min(3, 'name needs to be at least 3 characters')
		.max(64, 'name needs to be at most 64 characters')
		.regex(/^[a-zA-Z0-9_-]+$/, 'name needs to be alphanumeric with only a dash or underscore'),
	description: z.string()
		.min(6, 'description needs to be at least 6 characters')
		.max(2000, 'description needs to be at most 2000 characters'),
	repoLink: z.string()
		.url()
		.regex(
			/^https:\/\/(github|gitlab).com\/[a-zA-Z0-9_-]{1,64}\/[a-zA-Z0-9_-]{1,64}$/,
			'repoLink needs to be a valid GitHub or GitLab repository link',
		)
		.optional(),
	wikiLink: z.string()
		.url('wikiLink needs to be a valid URL')
		.optional(),
	releaseChannels: z.array(z.object({
		name: z.string()
			.min(3, 'name needs to be at least 3 characters')
			.max(64, 'name needs to be at most 64 characters')
			.regex(/^[a-zA-Z0-9_-]+$/, 'name needs to be alphanumeric with only a dash or underscore'),
		supportedVersions: z.string()
			.min(1, 'supportedVersions needs to be at least 1 character')
			.max(20, 'supportedVersions needs to be at most 20 characters'),
		dependencies: z.array(
			z.string()
				.min(1, 'dependency needs to be at least 1 character')
				.max(64, 'dependency needs to be at most 64 characters'),
		)
			.max(10, 'dependencies needs to be at most 10 items')
			.default([]),
		fileNaming: z.string()
			.min(3, 'fileNaming needs to be at least 3 characters')
			.max(64, 'fileNaming needs to be at most 64 characters')
			.default('$project.jar'),
	})).default([
		{
			name: 'Dev',
			supportedVersions: 'Unknown',
		},
	]),
});

export type NewProjectBody = z.infer<typeof newProjectSchema>;

export interface NewProjectResponse {
	project: Project;
	release_channels: InsertReleaseChannel[];
}

// TODO: Deprecate this endpoint, the path makes no sense - move to POST /api/projects
// POST /api/projects/:projectName/new
export async function postNewProject(ctx: Ctx, body: NewProjectBody) {
	const userId = ctx.get('userId');

	// Verify no existing project with that name exists (for this user)
	const existingProject = await ProjectStore.getProjectByName(body.name);
	if (existingProject !== undefined) {
		return errors.ProjectAlreadyExists.toResponse(ctx);
	}

	// Verify we have at least one release channel
	if (body.releaseChannels === undefined || body.releaseChannels.length === 0) {
		return errors.NoReleaseChannels.toResponse(ctx);
	}

	// Create a new project
	const project = await ProjectStore.insertNewProject({
		userId,
		name: body.name,
		description: body.description,
		repoLink: body.repoLink,
	});
	if (project === undefined) {
		return errors.InternalError.toResponse(ctx);
	}

	// Create release channels
	const channels: InsertReleaseChannel[] = body.releaseChannels.map(channel => ({
		projectId: project.projectId,
		name: channel.name,
		supportedVersions: channel.supportedVersions,
		dependencies: channel.dependencies,
		fileNaming: channel.fileNaming,
	}));

	const createdChannels = await ReleaseChannelStore.insertNewReleaseChannel(channels);
	await ProjectSettingStore.newProject(project.projectId);

	await ProjectStore.updateProject(
		project.projectId,
		{ defaultReleaseChannel: createdChannels[0].releaseChannelId },
	);

	return success('Project created!', {
		project,
		release_channels: channels,
	});
}

export const projectSettingsSchema = z.object({
	overwritePluginYml: z.boolean({ invalid_type_error: 'overwritePluginYml needs to be a boolean' }).optional(),
});

export type ProjectSettingsBody = z.infer<typeof projectSettingsSchema>;

// PATCH /api/projects/:projectName/settings
export async function patchProjectSettings(ctx: Ctx, body: ProjectSettingsBody) {
	const userId = ctx.get('userId');
	const projectName = ctx.req.param('projectName');

	if (Object.keys(body).length === 0) {
		return errors.NothingToUpdate.toResponse(ctx);
	}

	// Get project
	const project = await ProjectStore.getProjectByNameAndUser(projectName, userId);
	if (project === undefined) {
		return errors.ProjectNotFound.toResponse(ctx);
	}

	// Update settings
	const updatedSettings = await ProjectSettingStore.updateSettings(project.projectId, body);

	return success('Settings updated!', updatedSettings);
}

export const patchProjectReleaseChannelSchema = z.object({
	name: z.string()
		.min(3, 'name needs to be at least 3 characters')
		.max(64, 'name needs to be at most 64 characters')
		.regex(/^[a-zA-Z0-9_-]+$/, 'name needs to be alphanumeric with only a dash or underscore')
		.optional(),
	supportedVersions: z.string()
		.min(1, 'supportedVersions needs to be at least 1 character')
		.max(20, 'supportedVersions needs to be at most 20 characters')
		.optional(),
	dependencies: z.array(
		z.string()
			.min(1, 'dependency needs to be at least 1 character')
			.max(64, 'dependency needs to be at most 64 characters'),
	)
		.max(10, 'dependencies needs to be at most 10 items')
		.optional(),
	fileNaming: z.string()
		.min(3, 'fileNaming needs to be at least 3 characters')
		.max(64, 'fileNaming needs to be at most 64 characters')
		.optional(),
});

export type PatchProjectReleaseChannelBody = z.infer<typeof patchProjectReleaseChannelSchema>;

// PATCH /api/projects/:projectName/:releaseChannel
export async function patchReleaseChannel(ctx: Ctx, body: PatchProjectReleaseChannelBody) {
	const userId = ctx.get('userId');
	const projectName = ctx.req.param('projectName');

	if (Object.keys(body).length === 0) {
		return errors.NothingToUpdate.toResponse(ctx);
	}

	// Get project
	const project = await ProjectStore.getProjectByNameAndUser(projectName, userId);
	if (project === undefined) {
		return errors.ProjectNotFound.toResponse(ctx);
	}

	// Get release channel
	const releaseChannels = await ReleaseChannelStore.getReleaseChannelsForProject(project.projectId);
	const releaseChannel = releaseChannels?.find(channel => channel.name === ctx.req.param('releaseChannel'));
	if (releaseChannel === undefined) {
		return errors.ReleaseChannelNotFound.toResponse(ctx);
	}

	const updatedReleaseChannel = await ReleaseChannelStore.updateReleaseChannel(releaseChannel.releaseChannelId, body);

	return success('Release channel updated!', updatedReleaseChannel);
}
