import { Buffer } from 'node:buffer';
import { Context } from 'hono';
import JSZip from 'jszip';
import { parse, stringify } from 'yaml';
import { success } from '~/api/api';
import * as errors from '~/api/errors';
import Constants from '~/shared/utils/constants';
import { Pages } from '~/shared/utils/routes';
import BuildStore from '~/store/builds';
import { getProjectByNameAndUser } from '~/store/projects';
import ReleaseChannelStore from '~/store/releaseChannels';
import { Ctx } from '~/types/hono';
import { getBuildId, getFilePath } from '~/utils/build';
import { sha256 } from '~/utils/crypto';
import { UploadMetadata } from '~/utils/validator/uploadValidator';
import type { Build, BuildWithReleaseChannel } from '~/store/schema';

// GET /api/builds/:projectName
export async function getAllProjectBuilds(ctx: Ctx) {
	const projectName = ctx.req.param('projectName');

	const builds = await BuildStore.getProjectBuilds(projectName);
	if (builds === null || builds.length === 0) {
		return errors.BuildNotFound.toResponse(ctx);
	}

	const res: { [releaseChannel: string]: BuildResponse[] } = {};
	for (const build of builds) {
		let arr = res[build.releaseChannel];
		if (arr === undefined) {
			res[build.releaseChannel] = [];
			arr = res[build.releaseChannel];
		}

		arr.push(toBuildResponse(build, projectName));
	}

	return success('Success', res);
}

// GET /api/builds/:projectName/latest
export async function getProjectLatestBuild(ctx: Context) {
	const projectName = ctx.req.param('projectName');

	const builds = await BuildStore.getLatestBuildsPerReleaseChannel(projectName);
	if (builds === null || builds.length === 0) {
		return errors.BuildNotFound.toResponse(ctx);
	}

	const res: { [releaseChannel: string]: BuildResponse } = {};
	for (const build of builds) {
		res[build.releaseChannel] = toBuildResponse(build, projectName, undefined, true);
	}

	return success('Success', res);
}

// GET /api/builds/:projectName/:releaseChannel/latest
export async function getLatestBuildForReleaseChannel(ctx: Context) {
	const projectName = ctx.req.param('projectName');
	const releaseChannel = ctx.req.param('releaseChannel');

	const build = await BuildStore.getLatestBuildForReleaseChannel(projectName, releaseChannel);
	if (build === null) {
		return errors.BuildNotFound.toResponse(ctx);
	}

	return success('Success', toBuildResponse(build, projectName, releaseChannel, true));
}

// GET /api/builds/:projectName/:releaseChannel/:version
export async function getProjectBuildVersion(ctx: Ctx) {
	const projectName = ctx.req.param('projectName');
	const releaseChannel = ctx.req.param('releaseChannel');
	const version = ctx.req.param('version');

	const buildId = getBuildId(version);
	if (buildId === null) {
		return errors.InvalidBuildId.toResponse(ctx);
	}

	const build = await BuildStore.getSpecificBuildForReleaseChannel(projectName, releaseChannel, buildId);
	if (build === null) {
		return errors.BuildNotFound.toResponse(ctx);
	}

	return success('Success', toBuildResponse(build, projectName, releaseChannel));
}

// POST /api/builds/:projectName/:releaseChannel/upload
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

	const releaseChannel = await ReleaseChannelStore.getReleaseChannel(releaseChannelName, project.project_id);
	if (releaseChannel === null) {
		return errors.ReleaseChannelNotFound.toResponse(ctx);
	}

	// Verify checksum
	const checksum = sha256(Buffer.from(await file.arrayBuffer()));
	if (checksum !== metadata.checksum) {
		return errors.InvalidUpload('Checksum does not match').toResponse(ctx);
	}

	const lastBuildId = await BuildStore.getLastBuildId();
	if (lastBuildId === null) {
		return errors.InternalError.toResponse(ctx);
	}
	const nextBuildId = lastBuildId + 1;

	// Modify the version
	const jsZip = new JSZip();
	const zip = await jsZip.loadAsync(await file.arrayBuffer());

	let pluginYml = zip.file('plugin.yml');
	if (pluginYml === null) {
		// Try .yaml
		pluginYml = zip.file('plugin.yaml');
		if (pluginYml === null) {
			return errors.InvalidUpload('plugin.yml not found').toResponse(ctx);
		}
	}
	const content = await pluginYml.async('string');
	const yaml = parse(content);
	if (yaml.version === undefined) {
		return errors.InvalidUpload('plugin.yml does not contain version').toResponse(ctx);
	}

	// Update the version
	yaml.version = `${releaseChannel.name} - ${nextBuildId}`;

	// Write the new plugin.yml
	const newYaml = stringify(yaml);
	zip.file('plugin.yml', newYaml);

	// Write the new jar
	const newJar = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });

	const fileHash = sha256(Buffer.from(newJar));

	// Upload build to R2
	const path = getFilePath(projectName, releaseChannelName, fileHash);
	console.log(`Uploading build to ${path}`);

	await ctx.env.R2.put(path, newJar, {
		httpMetadata: {
			contentType: 'application/java-archive',
			cacheControl: Constants.ONE_YEAR_CACHE,
		},
		sha256: fileHash,
	});

	// Add build to database
	// TODO: Make build ID per project
	await BuildStore.insertNewBuild({
		buildId: nextBuildId,
		releaseChannelId: releaseChannel.releaseChannelId,
		projectId: project.project_id,
		fileHash,
		supportedVersions: metadata.supported_versions ?? releaseChannel.supportedVersions,
		dependencies: metadata.dependencies ?? releaseChannel.dependencies,
		releaseNotes: metadata.release_notes ?? '',
	});

	return success('Success');
}

function toBuildResponse(
	build: Build | BuildWithReleaseChannel,
	projectName: string,
	releaseChannel?: string,
	latest: boolean = false,
): BuildResponse {
	const version = latest ? 'latest' : String(build.buildId);
	const downloadPath = Pages.downloadSpecificBuild.toUrl({
		projectName, releaseChannel: (build as BuildWithReleaseChannel).releaseChannel ?? releaseChannel, version,
	});

	return {
		projectName,
		releaseChannel: (build as BuildWithReleaseChannel).releaseChannel ?? releaseChannel,
		buildId: build.buildId,
		build_id: build.buildId, // TODO: Remove - here to keep compatibility for auto-updater
		fileHash: build.fileHash,
		fileDownloadUrl: `${Constants.DOMAIN}${downloadPath}`,
		// TODO: Remove - here to keep compatibility for auto-updater
		file_download_url: `${Constants.DOMAIN}${downloadPath}`,
		supportedVersions: build.supportedVersions,
		dependencies: build.dependencies,
		releaseNotes: build.releaseNotes,
	};
}
