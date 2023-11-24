import { Context } from 'hono';
import { z } from 'zod';
import { success } from '~/api/api';
import * as errors from '~/api/errors';
import { getProjectByName, getProjectListByUser, newProject } from '~/store/projects';
import { createReleaseChannels } from '~/store/releaseChannels';
import { Ctx } from '~/types/hono';

// GET /api/projects
export async function getProjects(ctx: Context) {
	const projects = await getProjectListByUser(ctx.env.DB);

	return success('Success', projects);
}

// GET /api/projects/:projectName
export async function getProject(ctx: Context) {
	const projectName = ctx.req.param('projectName');

	const project = await getProjectByName(ctx.env.DB, projectName);

	return success('Success', project);
}

export const newProjectSchema = z.object({
	name: z.string().min(3).max(64),
	description: z.string().min(6).max(2000).optional(),
	release_channels: z.array(z.object({
		name: z.string(),
		supported_versions: z.string(),
		dependencies: z.array(z.string()).default([]),
		file_naming: z.string().default('$project.jar'),
	})).default([
		{
			name: 'Dev',
			supported_versions: 'Unknown',
		},
	]),
});

type Body = z.infer<typeof newProjectSchema>;

// POST /api/projects/:projectName/new
export async function postNewProject(ctx: Ctx, body: Body) {
	const userId = ctx.get('userId');

	// Verify no existing project with that name exists (for this user)
	const existingProject = await getProjectByName(ctx.env.DB, body.name);
	if (existingProject !== null) {
		return errors.ProjectAlreadyExists.toResponse(ctx);
	}

	// Create a new project
	const project = await newProject(ctx.env.DB, userId, body.name, body.description ?? 'A new project');
	if (project === null) {
		return errors.InternalError.toResponse(ctx);
	}

	// Create release channels
	const channels: Omit<ReleaseChannel, 'release_channel_id'>[] = body.release_channels.map(channel => ({
		project_id: project.project_id,
		name: channel.name,
		supported_versions: channel.supported_versions,
		dependencies: channel.dependencies,
		file_naming: channel.file_naming,
	}));

	await createReleaseChannels(ctx.env.DB, channels);

	return success('Project created!', {
		project,
		release_channels: channels,
	});
}
