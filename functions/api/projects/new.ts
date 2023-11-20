import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { handleAuth } from '~/functions/middleware/auth';
import { getProjectByNameAndUser, newProject } from '~/functions/store/projects';
import { createReleaseChannels } from '~/functions/store/releaseChannels';
import { ErrorCode, badRequest, ok } from '~/functions/utils/api';
import { parseJson } from '~/functions/utils/zod';

const newProjectSchema = z.object({
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

const handleNewProject: BlobFunction = async ({ request, env, data }) => {
	const body = await request.text();

	const parser = parseJson(body, newProjectSchema);
	if (!parser.success) {
		return badRequest(ErrorCode.INVALID_JSON, fromZodError(parser.error).message);
	}

	const { name, description, release_channels } = parser.data;

	// Verify no existing project with that name exists (for this user)
	const existingProject = await getProjectByNameAndUser(env.DB, name, data.userId);
	if (existingProject !== null) {
		return badRequest(ErrorCode.PROJECT_ALREADY_EXISTS, 'A project with that name already exists!');
	}

	// Create a new project
	const project = await newProject(env.DB, data.userId, name, description ?? 'A new project');
	if (project === null) {
		return badRequest(ErrorCode.INTERNAL_ERROR, 'Failed to create project!');
	}

	// Create release channels
	const channels: Omit<ReleaseChannel, 'release_channel_id'>[] = release_channels.map(channel => ({
		project_id: project.project_id,
		name: channel.name,
		supported_versions: channel.supported_versions,
		dependencies: channel.dependencies,
		file_naming: channel.file_naming,
	}));

	await createReleaseChannels(env.DB, channels);

	return ok('Project created!', {
		project,
		release_channels: channels,
	});
};

export const onRequest = [handleAuth, handleNewProject];
