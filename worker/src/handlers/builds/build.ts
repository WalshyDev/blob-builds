import { Buffer } from 'node:buffer';
import { Context } from 'hono';
import { success } from '~/api/api';
import * as errors from '~/api/errors';
import Constants from '~/shared/utils/constants';
import { getLatestBuild, getLatestBuildsPerReleaseChannel, insertNewBuild } from '~/store/builds';
import { getProjectByNameAndUser } from '~/store/projects';
import { getReleaseChannel } from '~/store/releaseChannels';
import { Ctx } from '~/types/hono';
import { getFilePath } from '~/utils/build';
import { sha256 } from '~/utils/crypto';
import { UploadMetadata } from '~/utils/validator/uploadValidator';

interface LatestBuildResponse {
	project_name: string;
	release_channel: string;
	build_id: number;
	file_hash: string;
	file_download_url: string;
	supported_versions: string;
  dependencies: string[];
  release_notes: string;
}

// GET /api/builds/:projectName/latest
export async function getProjectsLatestBuild(ctx: Context) {
	const projectName = ctx.req.param('projectName');

	const builds = await getLatestBuildsPerReleaseChannel(ctx.env.DB, projectName);
	if (builds === null || builds.length === 0) {
		return errors.BuildNotFound.toResponse(ctx);
	}

	const res: { [releaseChannel: string]: LatestBuildResponse } = {};
	for (const build of builds) {
		res[build.release_channel] = {
			project_name: projectName,
			release_channel: build.release_channel,
			build_id: build.build_id,
			file_hash: build.file_hash,
			file_download_url: `${Constants.DOMAIN}/builds/${projectName}/${build.release_channel}/latest`,
			supported_versions: build.supported_versions,
			dependencies: build.dependencies,
			release_notes: build.release_notes,
		};
	}

	return success('Success', res);
}

// GET /api/builds/:projectName/:releaseChannel/latest
export async function getLatestBuildForReleaseChannel(ctx: Context) {
	const projectName = ctx.req.param('projectName');
	const releaseChannel = ctx.req.param('releaseChannel');

	const build = await getLatestBuild(ctx.env.DB, projectName, releaseChannel);
	if (build === null) {
		return errors.BuildNotFound.toResponse(ctx);
	}

	const res: LatestBuildResponse = {
		project_name: projectName,
		release_channel: releaseChannel,
		build_id: build.build_id,
		file_hash: build.file_hash,
		file_download_url: `${Constants.DOMAIN}/builds/${projectName}/${releaseChannel}/latest`,
		supported_versions: build.supported_versions,
		dependencies: build.dependencies,
		release_notes: build.release_notes,
	};

	return success('Success', res);
}

export async function postUploadBuild(ctx: Ctx, file: File, metadata: UploadMetadata) {
	// Validation
	if (file.name.endsWith('.jar') === false) {
		return errors.InvalidUpload('File must be a jar file').toResponse(ctx);
	}

	const userId = ctx.get('userId');

	const projectName = ctx.req.param('projectName');
	const releaseChannelName = ctx.req.param('releaseChannel');

	const project = await getProjectByNameAndUser(ctx.env.DB, projectName, userId);
	if (project === null) {
		return errors.ProjectNotFound.toResponse(ctx);
	}

	const releaseChannel = await getReleaseChannel(ctx.env.DB, releaseChannelName, project.project_id);
	if (releaseChannel === null) {
		return errors.ReleaseChannelNotFound.toResponse(ctx);
	}

	// Verify checksum
	const checksum = sha256(new Buffer(await file.arrayBuffer()));
	if (checksum !== metadata.checksum) {
		return errors.InvalidUpload('Checksum does not match').toResponse(ctx);
	}

	// Upload build to R2
	const path = getFilePath(projectName, releaseChannelName, checksum);
	console.log(`Uploading build to ${path}`);

	await ctx.env.R2.put(path, file.stream(), {
		httpMetadata: {
			contentType: 'application/java-archive',
			cacheControl: Constants.ONE_YEAR_CACHE,
		},
		sha256: checksum,
	});

	// Add build to database
	// TODO: Make build ID per project
	await insertNewBuild(ctx.env.DB, {
		file_hash: checksum,
		supported_versions: metadata.supported_versions ?? releaseChannel.supported_versions,
		dependencies: metadata.dependencies ?? releaseChannel.dependencies,
		release_notes: metadata.release_notes ?? '',
	}, project.project_id, releaseChannel.release_channel_id);

	return success('Success');
}
