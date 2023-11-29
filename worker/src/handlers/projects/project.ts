import { Context } from 'hono';
import { z } from 'zod';
import { success } from '~/api/api';
import * as errors from '~/api/errors';
import ProjectSettingStore from '~/store/ProjectSettingStore';
import ProjectStore from '~/store/ProjectStore';
import ReleaseChannelStore from '~/store/ReleaseChannelStore';
import { InsertReleaseChannel } from '~/store/schema';
import { Ctx } from '~/types/hono';

// GET /api/projects
export async function getProjects() {
	const projects = await ProjectStore.getProjectListByUser();

	return success('Success', projects);
}

// GET /api/projects/:projectName
export async function getProject(ctx: Context) {
	const projectName = ctx.req.param('projectName');

	const project = await ProjectStore.getProjectByName(projectName);

	return success('Success', project);
}

export const newProjectSchema = z.object({
	name: z.string().min(3).max(64),
	description: z.string().min(6).max(2000).optional(),
	releaseChannels: z.array(z.object({
		name: z.string(),
		supportedVersions: z.string(),
		dependencies: z.array(z.string()).default([]),
		fileNaming: z.string().default('$project.jar'),
	})).default([
		{
			name: 'Dev',
			supportedVersions: 'Unknown',
		},
	]),
});

type Body = z.infer<typeof newProjectSchema>;

// POST /api/projects/:projectName/new
export async function postNewProject(ctx: Ctx, body: Body) {
	const userId = ctx.get('userId');

	// Verify no existing project with that name exists (for this user)
	const existingProject = await ProjectStore.getProjectByName(body.name);
	if (existingProject !== undefined) {
		return errors.ProjectAlreadyExists.toResponse(ctx);
	}

	// Create a new project
	const project = await ProjectStore.insertNewProject({
		userId,
		name: body.name,
		description: body.description ?? 'A new project',
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

	await ReleaseChannelStore.insertNewReleaseChannel(channels);
	await ProjectSettingStore.newProject(project.projectId);

	return success('Project created!', {
		project,
		release_channels: channels,
	});
}

export const projectSettingsSchema = z.object({
	overwritePluginYml: z.boolean().optional(),
});

type ProjectSettingsBody = z.infer<typeof projectSettingsSchema>;

// PATCH /api/projects/:projectName/settings
export async function patchProjectSettings(ctx: Ctx, body: ProjectSettingsBody) {
	const userId = ctx.get('userId');
	const projectName = ctx.req.param('projectName');

	// Get project
	const project = await ProjectStore.getProjectByNameAndUser(projectName, userId);
	if (project === undefined) {
		return errors.ProjectNotFound.toResponse(ctx);
	}

	// Update settings
	const updatedSettings = await ProjectSettingStore.updateSettings(project.projectId, body);

	return success('Settings updated!', updatedSettings);
}
