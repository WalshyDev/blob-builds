import * as errors from '~/api/errors';
import BuildStore from '~/store/BuildStore';
import ProjectStore from '~/store/ProjectStore';
import ReleaseChannelStore from '~/store/ReleaseChannelStore';
import { Ctx } from '~/types/hono';
import { getBuildId, getFileName, getFilePath, getLegacyFilePath } from '~/utils/build';
import { getStore } from '~/utils/storage';
import type { Build } from '~/store/schema';

export async function getDownloadBuild(ctx: Ctx) {
	const projectName = ctx.req.param('projectName');
	const releaseChannelName = ctx.req.param('releaseChannel');
	const version = ctx.req.param('version');

	const project = await ProjectStore.getProjectByName(projectName);
	if (project === undefined) {
		return errors.ProjectNotFound.toResponse(ctx);
	}

	const releaseChannel = await ReleaseChannelStore.getReleaseChannel(releaseChannelName, project.projectId);
	if (releaseChannel === undefined) {
		return errors.ReleaseChannelNotFound.toResponse(ctx);
	}

	let build: Build;
	if (version !== undefined && version !== '') {
		const buildId = getBuildId(version);
		if (buildId === null) {
			return errors.InvalidBuildId.toResponse(ctx);
		}

		const specificBuild = await BuildStore.getSpecificBuildForReleaseChannel(projectName, releaseChannelName, buildId);
		if (specificBuild === undefined) {
			return errors.BuildNotFound.toResponse(ctx);
		}
		build = specificBuild;
	} else {
		const latestBuild = await BuildStore.getLatestBuildForReleaseChannel(projectName, releaseChannelName);
		if (latestBuild === undefined) {
			return errors.BuildNotFound.toResponse(ctx);
		}
		build = latestBuild;
	}

	const filePath = getFilePath(projectName, releaseChannelName, build.fileHash);
	console.log(`Downloading: ${filePath}`);
	let object = await ctx.env.R2.get(filePath);
	if (object === null) {
		console.log(`New path failed... trying legacy: ${filePath}`);
		// TODO: Remove
		const legacyFilePath = getLegacyFilePath(projectName, releaseChannelName, build.fileHash);
		object = await ctx.env.R2.get(legacyFilePath);
		if (object === null) {
			return errors.BuildNotFound.toResponse(ctx);
		}
	}

	// Write download analytics
	const store = getStore();
	const downloadAnalytics = store.downloadAnalytics;
	downloadAnalytics.set({
		project: projectName,
		releaseChannel: releaseChannelName,

		build: build.buildId,
	});
	downloadAnalytics.write(store.env);

	// Set headers
	const headers = new Headers();
	object.writeHttpMetadata(headers);

	headers.append('Content-Disposition', `attachment; filename="${getFileName(project, releaseChannel, build)}"`);
	headers.append('x-build', String(build.buildId));

	console.log(Object.fromEntries(headers.entries()));

	return new Response(object.body, {
		headers,
	});
}
