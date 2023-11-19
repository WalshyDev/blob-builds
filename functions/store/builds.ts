import { queryRow, queryRows, run } from '~/functions/store/_db';

export async function getLatestBuild(
	DB: D1Database,
	projectName: string,
	releaseChannel: string,
) {
	const res = await queryRow<Build>(
		DB,
		`
			SELECT builds.*
			FROM builds
			LEFT JOIN projects ON projects.project_id = builds.project_id
			LEFT JOIN release_channels ON release_channels.release_channel_id = builds.release_channel_id
			WHERE projects.name = $1 AND release_channels.name = $2
		`,
		projectName, releaseChannel,
	);

	if (res.success) {
		// TODO: Hack
		if (res.data) {
			res.data.dependencies = JSON.parse(res.data.dependencies as unknown as string);
		}

		return res.data;
	} else {
		console.error(`getLatestBuild: Failed to get latest build! Error: ${res.internalError}`);
		return null;
	}
}

export async function getLatestBuilds(
	DB: D1Database,
	projectName: string,
) {
	const res = await queryRows<Build & { release_channel: string }>(
		DB,
		`
			SELECT builds.*, release_channels.name AS release_channel
			FROM builds
			LEFT JOIN projects ON projects.project_id = builds.project_id
			LEFT JOIN release_channels ON release_channels.release_channel_id = builds.release_channel_id
			WHERE projects.name = $1
		`,
		projectName,
	);

	if (res.success) {
		// TODO: Hack
		if (res.data) {
			for (const build of res.data) {
				build.dependencies = JSON.parse(build.dependencies as unknown as string);
			}
		}

		return res.data;
	} else {
		console.error(`getLatestBuild: Failed to get latest build! Error: ${res.internalError}`);
		return null;
	}
}

export async function insertNewBuild(
	DB: D1Database,
	build: Omit<Build, 'build_id' | 'release_channel_id' | 'project_id'>,
	projectId: number,
	releaseChannelId: number,
) {
	const res = await run<Project>(
		DB,
		`INSERT INTO builds (release_channel_id, project_id, file_hash, supported_versions, dependencies, release_notes)
			VALUES ($1, $2, $3, $4, $5, $6)
		`,
		releaseChannelId, projectId, build.file_hash, build.supported_versions, build.dependencies, build.release_notes,
	);

	console.log('inserted new build');
	console.log(res);

	if (res.success) {
		return res.data;
	} else {
		console.error(`getProject: Failed to get project! Error: ${res.internalError}`);
		return null;
	}
}
