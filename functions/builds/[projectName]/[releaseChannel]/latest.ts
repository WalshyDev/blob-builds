import { getLatestBuild } from '~/functions/store/builds';
import { getProjectByName } from '~/functions/store/projects';
import { getReleaseChannel } from '~/functions/store/releaseChannels';
import { ErrorCode, notFound } from '~/functions/utils/api';

export const onRequestGet: BlobFunction = async ({ env, params, waitUntil }) => {
	const { projectName, releaseChannel } = params;

	const project = await getProjectByName(env.DB, projectName as string);
	if (project === null) {
		return notFound(ErrorCode.PROJECT_NOT_FOUND, 'Project not found!');
	}

	const channel = await getReleaseChannel(env.DB, releaseChannel as string, project.project_id);
	if (channel === null) {
		return notFound(ErrorCode.RELEASE_CHANNEL_NOT_FOUND, 'Release channel not found!');
	}

	const build = await getLatestBuild(env.DB, projectName as string, releaseChannel as string);
	if (build === null) {
		return notFound(ErrorCode.BUILD_NOT_FOUND, 'Build not found!');
	}

	// See if we have it in cache before fetching from R2
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const cache = caches.default;
	const cacheKey = `https://blob.build/download/${projectName}/${releaseChannel}/${build.file_hash}`;
	const cachedFile = await cache.match(cacheKey);
	if (cachedFile) {
		return cachedFile;
	}

	const file = await env.R2.get(`${projectName}/${releaseChannel}/${build.file_hash}`);
	if (file === null) {
		return notFound(ErrorCode.BUILD_NOT_FOUND, 'Build file not found!');
	}

	const fileName = channel.file_naming
		.replace('$project', project.name)
		.replace('$releaseChannel', channel.name)
		.replace('$buildId', String(build.build_id));

	const res = new Response(file.body, {
		headers: {
			'Content-Disposition': `attachment; filename="${fileName}"`,
		},
	});

	// Put into cache
	waitUntil(cache.put(cacheKey, res.clone()));

	return res;
};
