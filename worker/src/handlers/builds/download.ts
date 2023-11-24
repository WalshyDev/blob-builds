import * as errors from '~/api/errors';
import { getLatestBuild } from '~/store/builds';
import { getProjectByName } from '~/store/projects';
import { getReleaseChannel } from '~/store/releaseChannels';
import { Ctx } from '~/types/hono';
import { getFileName, getFilePath, getLegacyFilePath } from '~/utils/build';

export async function getDownloadBuild(ctx: Ctx) {
	const projectName = ctx.req.param('projectName');
	const releaseChannelName = ctx.req.param('releaseChannel');

	const project = await getProjectByName(ctx.env.DB, projectName);
	if (project === null) {
		return errors.ProjectNotFound.toResponse(ctx);
	}

	const releaseChannel = await getReleaseChannel(ctx.env.DB, releaseChannelName, project.project_id);
	if (releaseChannel === undefined) {
		return errors.ReleaseChannelNotFound.toResponse(ctx);
	}

	const build = await getLatestBuild(ctx.env.DB, projectName, releaseChannelName);
	if (build === null) {
		return errors.BuildNotFound.toResponse(ctx);
	}

	const filePath = getFilePath(projectName, releaseChannelName, build.file_hash);
	console.log(`Downloading: ${filePath}`);
	let object = await ctx.env.R2.get(filePath);
	if (object === null) {
		console.log(`New path failed... trying legacy: ${filePath}`);
		// TODO: Remove
		const legacyFilePath = getLegacyFilePath(projectName, releaseChannelName, build.file_hash);
		object = await ctx.env.R2.get(legacyFilePath);
		if (object === null) {
			return errors.BuildNotFound.toResponse(ctx);
		}
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);

	headers.append('Content-Disposition', `attachment; filename="${getFileName(project, releaseChannel, build)}"`);
	headers.append('x-build', String(build.build_id));

	console.log(Object.fromEntries(headers.entries()));

	return new Response(object.body, {
		headers,
	});
}
