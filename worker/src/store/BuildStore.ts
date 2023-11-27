import { eq, desc, and, sql } from 'drizzle-orm';
import { selectStar } from '~/store/_db';
import { Build, BuildWithReleaseChannel, InsertBuild, builds, projects, releaseChannels } from '~/store/schema';
import { getDb } from '~/utils/storage';

class _BuildStore {

	// Get all builds for a project
	getProjectBuilds(projectName: string): Promise<BuildWithReleaseChannel[]> {
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

	// Get latest build for a project and release channel
	getLatestBuildForReleaseChannel(projectName: string, releaseChannel: string): Promise<Build> {
		return getDb().select({ ...selectStar(builds) })
			.from(builds)
			.leftJoin(projects, eq(projects.projectId, builds.projectId))
			.leftJoin(releaseChannels, eq(releaseChannels.releaseChannelId, builds.releaseChannelId))
			.where(
				and(
					eq(projects.name, projectName),
					eq(releaseChannels.name, releaseChannel),
				),
			)
			.orderBy(desc(builds.buildId))
			.get();
	}

	// Get latest build for each release channel for a project
	getLatestBuildsPerReleaseChannel(projectName: string): Promise<BuildWithReleaseChannel[]> {
		/*
			SELECT
				release_channels.name,
				builds.*
			FROM builds
			LEFT JOIN projects on projects.project_id = builds.project_id
			LEFT JOIN release_channels on release_channels.release_channel_id = builds.release_channel_id
			WHERE projects.name = 'Slimefun4' AND builds.build_id = (
				SELECT build_id FROM builds
				WHERE builds.release_channel_id = release_channels.release_channel_id
				ORDER BY builds.build_id DESC
				LIMIT 1
			);
		*/
		return getDb().select({
			...selectStar(builds),
			releaseChannel: releaseChannels.name,
		})
			.from(builds)
			.leftJoin(projects, eq(projects.projectId, builds.projectId))
			.leftJoin(releaseChannels, eq(releaseChannels.releaseChannelId, builds.releaseChannelId))
			.where(
				and(
					eq(projects.name, projectName),
					eq(builds.buildId,
						getDb().select({ buildId: builds.buildId }).from(builds)
							.where(eq(builds.releaseChannelId, releaseChannels.releaseChannelId))
							.orderBy(desc(builds.buildId))
							.limit(1),
					),
				),
			)
			.all();
	}

	// Get build for a project and release channel
	getSpecificBuildForReleaseChannel(projectName: string, releaseChannel: string, buildId: number): Promise<Build> {
		return getDb().select({ ...selectStar(builds) })
			.from(builds)
			.leftJoin(projects, eq(projects.projectId, builds.projectId))
			.leftJoin(releaseChannels, eq(releaseChannels.releaseChannelId, builds.releaseChannelId))
			.where(
				and(
					eq(projects.name, projectName),
					eq(releaseChannels.name, releaseChannel),
					eq(builds.buildId, buildId),
				),
			)
			.get();
	}

	async getBuildCount(projectId: number, releaseChannelId: number): Promise<{ count: number }> {
		return getDb().select({ count: sql<number>`COUNT(*)` })
			.from(builds)
			.where(and(
				eq(builds.projectId, projectId),
				eq(builds.releaseChannelId, releaseChannelId),
			))
			.get();
	}

	insertNewBuild(build: InsertBuild): Promise<D1Result> {
		return getDb().insert(builds)
			.values(build)
			.run();
	}
}

const BuildStore = new _BuildStore();
export default BuildStore;
