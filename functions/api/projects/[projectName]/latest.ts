import { getLatestBuilds } from '~/functions/store/builds';
import { ErrorCode, notFound, ok } from '~/functions/utils/api';
import Constants from '~/utils/constants';

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

export const onRequestGet: BlobFunction = async ({ env, params }) => {
	const { projectName } = params;

	const builds = await getLatestBuilds(env.DB, projectName as string);
	if (builds === null || builds.length === 0) {
		return notFound(ErrorCode.BUILD_NOT_FOUND, 'Builds not found!');
	}
	console.log(builds);

	const res: { [releaseChannel: string]: LatestBuildResponse } = {};
	for (const build of builds) {
		res[build.release_channel] = {
			project_name: projectName as string,
			release_channel: build.release_channel as string,
			build_id: build.build_id,
			file_hash: build.file_hash,
			file_download_url: `${Constants.DOMAIN}/builds/${projectName}/${build.release_channel}/latest`,
			supported_versions: build.supported_versions,
			dependencies: build.dependencies,
			release_notes: build.release_notes,
		};
	}

	return ok('Success', res);
};
