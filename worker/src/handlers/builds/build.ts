import { Buffer } from 'node:buffer';
import { Context } from 'hono';
import JSZip from 'jszip';
import { parse, stringify } from 'yaml';
import { success } from '~/api/api';
import * as errors from '~/api/errors';
import BuildStore from '~/store/BuildStore';
import ProjectSettingStore from '~/store/ProjectSettingStore';
import ProjectStore from '~/store/ProjectStore';
import ReleaseChannelStore from '~/store/ReleaseChannelStore';
import { Ctx } from '~/types/hono';
import { getBuildId, getFilePath } from '~/utils/build';
import Constants from '~/utils/constants';
import { sha256 } from '~/utils/crypto';
import { postBuildToDiscord } from '~/utils/discord';
import { getPagination } from '~/utils/pagination';
import { UploadMetadata } from '~/utils/validator/uploadValidator';
import type { Build, BuildWithReleaseChannel, Project } from '~/store/schema';

export interface GetAllBuildsResponse {
	[releaseChannel: string]: BuildResponse[];
}

// GET /api/builds/:projectName
export async function getAllProjectBuilds(ctx: Ctx) {
	const projectName = ctx.req.param('projectName');

	const project = await ProjectStore.getProjectByName(projectName);
	if (project === undefined) {
		return errors.ProjectNotFound.toResponse(ctx);
	}
	const builds = await BuildStore.getProjectBuilds(projectName);
	const releaseChannels = await ReleaseChannelStore.getReleaseChannelsForProject(project.projectId);

	const res: GetAllBuildsResponse = {};
	for (const releaseChannel of releaseChannels) {
		res[releaseChannel.name] = [];
	}
	for (const build of builds) {
		res[build.releaseChannel].push(toBuildResponse(build, project));
	}

	return success('Success', res);
}

// GET /api/builds/:projectName/:releaseChannel
export async function getAllProjectBuildsForReleaseChannel(ctx: Ctx) {
	const projectName = ctx.req.param('projectName');
	const releaseChannelName = ctx.req.param('releaseChannel');
	const pagination = getPagination(ctx);

	const project = await ProjectStore.getProjectByName(projectName);
	if (project === undefined) {
		return errors.ProjectNotFound.toResponse(ctx);
	}
	const releaseChannel = await ReleaseChannelStore.getReleaseChannel(releaseChannelName, project.projectId);
	if (releaseChannel === undefined) {
		return errors.ReleaseChannelNotFound.toResponse(ctx);
	}
	const builds = await BuildStore.getProjectBuildsForReleaseChannel(
		project.projectId,
		releaseChannel.releaseChannelId,
		pagination,
	);

	const res: { [releaseChannel: string]: BuildResponse[] } = {};
	res[releaseChannel.name] = [];
	for (const build of builds) {
		res[releaseChannel.name].push(toBuildResponse(build, project, releaseChannel.name));
	}

	const total = await BuildStore.countBuildsForReleaseChannel(project.projectId, releaseChannel.releaseChannelId);
	if (total !== undefined) {
		pagination.total = total.count;
	}

	return success('Success', res, pagination);
}

// GET /api/builds/:projectName/:releaseChannel/latest
export async function getLatestBuildForReleaseChannel(ctx: Context) {
	const projectName = ctx.req.param('projectName');
	const releaseChannel = ctx.req.param('releaseChannel');

	const project = await ProjectStore.getProjectByName(projectName);
	if (project === undefined) {
		return errors.ProjectNotFound.toResponse(ctx);
	}
	const build = await BuildStore.getLatestBuildForReleaseChannel(projectName, releaseChannel);
	if (build === undefined) {
		return errors.BuildNotFound.toResponse(ctx);
	}

	return success('Success', toBuildResponse(build, project, releaseChannel, true));
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

	const project = await ProjectStore.getProjectByName(projectName);
	if (project === undefined) {
		return errors.ProjectNotFound.toResponse(ctx);
	}
	const build = await BuildStore.getSpecificBuildForReleaseChannel(projectName, releaseChannel, buildId);
	if (build === undefined) {
		return errors.BuildNotFound.toResponse(ctx);
	}

	return success('Success', toBuildResponse(build, project, releaseChannel));
}

// POST /api/builds/:projectName/:releaseChannel/upload
export async function postUploadBuild(ctx: Ctx, file: File, metadata: UploadMetadata) {
	// Validation
	if (file.name.endsWith('.jar') === false) {
		return errors.InvalidUpload('File must be a jar file').toResponse(ctx);
	}

	const userId = ctx.get('userId');
	const user = ctx.get('user');

	const projectName = ctx.req.param('projectName');
	const releaseChannelName = ctx.req.param('releaseChannel');

	const project = await ProjectStore.getProjectByNameAndUser(projectName, userId);
	if (project === undefined) {
		return errors.ProjectNotFound.toResponse(ctx);
	}

	const releaseChannel = await ReleaseChannelStore.getReleaseChannel(releaseChannelName, project.projectId);
	if (releaseChannel === undefined) {
		return errors.ReleaseChannelNotFound.toResponse(ctx);
	}

	// Verify checksum
	const checksum = sha256(Buffer.from(await file.arrayBuffer()));
	if (checksum !== metadata.checksum) {
		return errors.InvalidUpload('Checksum does not match').toResponse(ctx);
	}

	const projectSettings = await ProjectSettingStore.getSettings(project.projectId);
	/* istanbul ignore if -- @preserve */
	// Ignore this branch as it should not ever hit, we should always create even if they somehow do not exist
	if (projectSettings === undefined) {
		return errors.InternalError.toResponse(ctx);
	}

	let lastBuildId = await BuildStore.getLastBuildId(project.projectId, releaseChannel.releaseChannelId);
	if (lastBuildId === undefined) {
		lastBuildId = { buildId: 0 };
	}
	const nextBuildId = lastBuildId.buildId + 1;

	let jarFile = await file.arrayBuffer();
	let fileHash = checksum;
	// Overwrite `version` in plugin.yml with the build ID.
	// If someone wants to bring their own version, they can disable this in the project settings.
	if (projectSettings.overwritePluginYml === true) {
		// Modify the version
		const jsZip = new JSZip();
		const zip = await jsZip.loadAsync(jarFile);

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
			return errors.InvalidUpload('plugin.yml does not contain a version').toResponse(ctx);
		}

		// Update the version
		yaml.version = `${releaseChannel.name} - ${nextBuildId}`;

		// Write the new plugin.yml
		const newYaml = stringify(yaml);
		zip.file('plugin.yml', newYaml);

		// Write the new jar
		jarFile = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
		fileHash = sha256(Buffer.from(jarFile));
	}

	// Upload build to R2
	const path = getFilePath(projectName, releaseChannelName, fileHash);
	console.log(`Uploading build to ${path}`);

	await ctx.env.R2.put(path, jarFile, {
		httpMetadata: {
			contentType: 'application/java-archive',
			cacheControl: Constants.ONE_YEAR_CACHE,
		},
		sha256: fileHash,
	});

	// Add build to database
	const build = await BuildStore.insertNewBuild({
		buildId: nextBuildId,
		releaseChannelId: releaseChannel.releaseChannelId,
		projectId: project.projectId,
		fileHash,
		supportedVersions: metadata.supported_versions ?? metadata.supportedVersions ?? releaseChannel.supportedVersions,
		dependencies: metadata.dependencies ?? releaseChannel.dependencies,
		releaseNotes: metadata.release_notes ?? metadata.releaseNotes ?? '',
		commitHash: metadata.commitHash,
	});

	// Post into Discord #builds
	ctx.executionCtx.waitUntil(postBuildToDiscord(ctx, user, project, releaseChannel, build));
	// await postBuildToDiscord(ctx, user, project, releaseChannel, build);

	return success('Success', toBuildResponse(build, project, releaseChannel.name));
}

function toBuildResponse(
	build: Build | BuildWithReleaseChannel,
	project: Project,
	releaseChannel?: string,
	latest: boolean = false,
): BuildResponse {
	const version = latest ? 'latest' : String(build.buildId);
	const directDownloadUrl = downloadUrl(
		project.name,
		(build as BuildWithReleaseChannel).releaseChannel ?? releaseChannel,
		version,
	);

	return {
		projectName: project.name,
		releaseChannel: (build as BuildWithReleaseChannel).releaseChannel ?? releaseChannel,
		buildId: build.buildId,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		build_id: build.buildId, // TODO: Remove - here to keep compatibility for auto-updater
		checksum: build.fileHash,
		fileDownloadUrl: `${directDownloadUrl}`,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		// TODO: Remove - here to keep compatibility for auto-updater
		file_download_url: `${directDownloadUrl}`,
		supportedVersions: build.supportedVersions,
		dependencies: build.dependencies,
		releaseNotes: build.releaseNotes,
		commitHash: build.commitHash ?? undefined,
		commitLink: build.commitHash !== null && project.repoLink !== null
			? `${project.repoLink}/commit/${build.commitHash}`
			: undefined,
	};
}

export function downloadUrl(projectName: string, releaseChannel: string, version: string) {
	return `${Constants.DOMAIN}/dl/${projectName}/${releaseChannel}/${version}`;
}
