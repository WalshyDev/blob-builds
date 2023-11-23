import * as errors from '~/api/errors';
import { getLatestBuild } from '~/store/builds';
import { getProjectByName } from '~/store/projects';
import { getReleaseChannel } from '~/store/releaseChannels';
import { Ctx } from '~/types/hono';
import { getFilePath } from '~/utils/build';

export async function getDownloadBuild(ctx: Ctx) {
	const projectName = ctx.req.param('projectName');
	const releaseChannelName = ctx.req.param('releaseChannel');

	const project = await getProjectByName(ctx.env.DB, projectName);
	if (project === null) {
		return errors.ProjectNotFound.toResponse(ctx);
	}

	const releaseChannel = getReleaseChannel(ctx.env.DB, releaseChannelName, project.project_id);
	if (releaseChannel === undefined) {
		return errors.ReleaseChannelNotFound.toResponse(ctx);
	}

	const build = await getLatestBuild(ctx.env.DB, projectName, releaseChannelName);
	if (build === null) {
		return errors.BuildNotFound.toResponse(ctx);
	}

	const filePath = getFilePath(projectName, releaseChannelName, build.file_hash);
	const object = await ctx.env.R2.get(filePath);
	if (object === null) {
		return errors.BuildNotFound.toResponse(ctx);
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);

	return new Response(object.body, {
		headers,
	});
}
