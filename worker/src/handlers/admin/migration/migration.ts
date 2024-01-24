import { Buffer } from 'node:buffer';
import { z } from 'zod';
import { success } from '~/api/api';
import * as errors from '~/api/errors';
import BuildStore from '~/store/BuildStore';
import ProjectStore from '~/store/ProjectStore';
import ReleaseChannelStore from '~/store/ReleaseChannelStore';
import { Ctx } from '~/types/hono';
import { getFilePath } from '~/utils/build';
import Constants from '~/utils/constants';
import { sha256 } from '~/utils/crypto';

export const rewriteBuildSchema = z.object({
	// Selectors
	projectName: z.string(),
	releaseChannel: z.string(),
	buildId: z.number().optional(),
	// Updatable properties
	newBuildId: z.number().optional(),
	checksum: z.string().length(64),
	supportedVersions: z.string().optional(),
	dependencies: z.array(z.string()).optional(),
	releaseNotes: z.string().optional(),
});

type RewriteBuildBody = z.infer<typeof rewriteBuildSchema>;

export async function postRewriteBuild(ctx: Ctx, file: File, metadata: RewriteBuildBody) {
	// File validation
	if (file.name.endsWith('.jar') === false) {
		return errors.InvalidUpload('File must be a jar file').toResponse(ctx);
	}

	// Verify checksum
	const checksum = sha256(Buffer.from(await file.arrayBuffer()));
	if (checksum !== metadata.checksum) {
		return errors.InvalidUpload('Checksum does not match').toResponse(ctx);
	}

	const project = await ProjectStore.getProjectByName(metadata.projectName);
	if (project === undefined) {
		return errors.ProjectNotFound.toResponse(ctx);
	}
	const releaseChannel = await ReleaseChannelStore.getReleaseChannel(metadata.releaseChannel, project.projectId);
	if (releaseChannel === undefined) {
		return errors.ReleaseChannelNotFound.toResponse(ctx);
	}
	// If we're rewriting a build, make sure it exists
	if (metadata.buildId !== undefined) {
		const existingBuild = await BuildStore.getSpecificBuildForReleaseChannel(
			metadata.projectName,
			metadata.releaseChannel,
			metadata.buildId,
		);
		if (existingBuild === undefined) {
			return errors.BuildNotFound.toResponse(ctx);
		}
	}

	// Upload file to R2
	const path = getFilePath(project.name, releaseChannel.name, metadata.checksum);
	await ctx.env.R2.put(path, file, {
		httpMetadata: {
			contentType: 'application/java-archive',
			cacheControl: Constants.ONE_YEAR_CACHE,
		},
		sha256: metadata.checksum,
	});

	let build;
	if (metadata.buildId !== undefined) {
		// Update the builds table
		build = await BuildStore.update(
			project.projectId,
			releaseChannel.releaseChannelId,
			metadata.buildId,
			{
				buildId: metadata.newBuildId ?? metadata.buildId,
				fileHash: metadata.checksum,
			},
		);
	} else {
		if (metadata.newBuildId === undefined) {
			return errors.InvalidUpload('newBuildId is required when buildId is not specified').toResponse(ctx);
		}

		// This is a new build
		build = await BuildStore.insertNewBuild({
			buildId: metadata.newBuildId,
			projectId: project.projectId,
			releaseChannelId: releaseChannel.releaseChannelId,
			supportedVersions: metadata.supportedVersions ?? 'Unknown',
			dependencies: metadata.dependencies ?? [],
			fileHash: metadata.checksum,
			releaseNotes: metadata.releaseNotes ?? '',
		});
	}

	return success('Rewrote build', build);
}
