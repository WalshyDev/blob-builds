import { eq, desc } from 'drizzle-orm';
import { SQLiteTableWithColumns, SQLiteColumn, TableConfig } from 'drizzle-orm/sqlite-core';
import { queryRow, queryRows, run } from '~/store/_db';
import { NewBuildWithReleaseChannel, builds, projects, releaseChannels } from '~/store/schema';
import { getDb } from '~/utils/storage';

type Columns<T extends TableConfig> = {
	[Key in keyof T['columns']]: T['columns'][Key];
}

function selectStar<T extends TableConfig>(
	table: SQLiteTableWithColumns<T>,
): Columns<T> {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return Object.fromEntries(
		Object.entries(table)
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			.filter(([_, val]) => val instanceof SQLiteColumn),
	);
}

class _BuildStore {

	getProjectBuilds(projectName: string): Promise<NewBuildWithReleaseChannel[]> {
		return getDb().select({
			...selectStar(builds),
			releaseChannel: releaseChannels.name,
		})
			.from(builds)
			.leftJoin(projects, eq(projects.projectId, builds.projectId))
			.leftJoin(releaseChannels, eq(releaseChannels.releaseChannelId, builds.releaseChannelId))
			.where(eq(projects.name, projectName))
			.orderBy(desc(builds.buildId))
			.all();
	}
}

const BuildStore = new _BuildStore();
export default BuildStore;

export async function getProjectBuilds(DB: D1Database, projectName: string) {
	const res = await queryRows<BuildWithReleaseChannel>(
		DB,
		`
			SELECT builds.*, release_channels.name AS release_channel
			FROM builds
			LEFT JOIN projects ON projects.project_id = builds.project_id
			LEFT JOIN release_channels ON release_channels.release_channel_id = builds.release_channel_id
			WHERE projects.name = $1
			ORDER BY builds.build_id DESC
		`,
		projectName,
	);

	if (res.success === true) {
		// TODO: Hack
		if (res.data) {
			for (const build of res.data) {
				build.dependencies = JSON.parse(build.dependencies as unknown as string);
			}
		}

		return res.data;
	} else {
		console.error(`getProjectBuilds: Failed to get project builds! Error: ${res.internalError}`);
		return null;
	}
}

export async function getProjectBuild(
	DB: D1Database,
	projectName: string,
	releaseChannel: string,
	buildId: number,
) {
	const res = await queryRow<Build>(
		DB,
		`
			SELECT builds.*
			FROM builds
			LEFT JOIN projects ON projects.project_id = builds.project_id
			LEFT JOIN release_channels ON release_channels.release_channel_id = builds.release_channel_id
			WHERE projects.name = $1 AND release_channels.name = $2 AND builds.build_id = $3
			ORDER BY builds.build_id DESC
		`,
		projectName, releaseChannel, buildId,
	);

	if (res.success === true) {
		// TODO: Hack
		if (res.data) {
			res.data.dependencies = JSON.parse(res.data.dependencies as unknown as string);
		}

		return res.data;
	} else {
		console.error(`getProjectBuild: Failed to get specific project build! Error: ${res.internalError}`);
		return null;
	}
}

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
			ORDER BY builds.build_id DESC
		`,
		projectName, releaseChannel,
	);

	if (res.success === true) {
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

export async function getLatestBuildsPerReleaseChannel(
	DB: D1Database,
	projectName: string,
) {
	const res = await queryRows<BuildWithReleaseChannel>(
		DB,
		`
			SELECT builds.*, release_channels.name AS release_channel
			FROM builds
			LEFT JOIN projects ON projects.project_id = builds.project_id
			LEFT JOIN release_channels ON release_channels.release_channel_id = builds.release_channel_id
			WHERE projects.name = $1
			ORDER BY builds.build_id DESC
		`,
		projectName,
	);

	if (res.success === true) {
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
	const res = await run(
		DB,
		`
			INSERT INTO builds (release_channel_id, project_id, file_hash, supported_versions, dependencies, release_notes)
			VALUES ($1, $2, $3, $4, $5, $6)
		`,
		releaseChannelId, projectId, build.file_hash, build.supported_versions, build.dependencies, build.release_notes,
	);

	if (res.success === true) {
		return res.data;
	} else {
		console.error(`getProject: Failed to get project! Error: ${res.internalError}`);
		return null;
	}
}

export async function getLastBuildId(DB: D1Database): Promise<number> {
	const res = await queryRow<{ seq: number }>(DB, 'select seq from sqlite_sequence WHERE name = "builds"');

	if (res.success === true) {
		return res.data.seq;
	} else {
		console.error(`getLastBuildId: Failed to get last build ID! Error: ${res.internalError}`);
		return null;
	}
}
