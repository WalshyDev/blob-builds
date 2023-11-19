import { getLatestBuild } from '~/functions/store/builds';
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
	const { projectName, releaseChannel } = params;

	const build = await getLatestBuild(env.DB, projectName as string, releaseChannel as string);
	if (build === null) {
		return notFound(ErrorCode.BUILD_NOT_FOUND, 'Build not found!');
	}

	const res: LatestBuildResponse = {
		project_name: projectName as string,
		release_channel: releaseChannel as string,
		build_id: build.build_id,
		file_hash: build.file_hash,
		file_download_url: `${Constants.DOMAIN}/builds/${projectName}/${releaseChannel}/latest`,
		supported_versions: build.supported_versions,
		dependencies: build.dependencies,
		release_notes: build.release_notes,
	};

	return ok('Success', res);
};
