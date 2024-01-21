import { and, eq, inArray, sql } from 'drizzle-orm';
import { projects, releaseChannels, users } from '~/store/schema';
import { getDb } from '~/utils/storage';
import type { InsertProject, Project, ReleaseChannel } from '~/store/schema';

export type ProjectList = SingleProjectList[];
type SingleProjectList = {
	name: string;
	owner: string;
	releaseChannels: string[];
};

export type ProjectListAbc = SingleProjectListAbc[];
type SingleProjectListAbc = {
	owner: string;
	name: string;
	description: string;
	repoLink: string | null;
	wikiLink: string | null;
	defaultReleaseChannel: {
		name: string;
		supportedVersions: string;
		dependencies: string;
	};
};

class _ProjectStore {

	getProjectListByUser(): Promise<ProjectList | null> {
		return getDb()
			.select({
				name: sql<string>`${projects.name} AS project_name`,
				owner: sql<string>`${users.name} as owner_name`,
				releaseChannels: sql<string[]>`
					(SELECT json_group_array(name) FROM release_channels WHERE release_channels.project_id = projects.project_id)
				`.mapWith((channels: string) => JSON.parse(channels)),
			})
			.from(projects)
			.leftJoin(users, eq(users.userId, projects.userId))
			.all();
	}

	// TODO: This sucks
	async getProjects(): Promise<ProjectListAbc> {
		// Get all projects with the owner name
		const projs: ({ owner: string } & Project)[] = await getDb()
			.select({
				...projects,
				owner: sql<string>`${users.name} as owner_name`,
			})
			.from(projects)
			.leftJoin(users, eq(users.userId, projects.userId))
			.all();

		const list: ProjectListAbc = [];
		for (const project of projs) {
			list.push(project);
		}

		// Fill in all the default release channel info where possible
		const releaseChannelIds = projs.filter((p) => p.defaultReleaseChannel !== null)
			.map(p => p.defaultReleaseChannel);

		let projectReleaseChannels: ReleaseChannel[] = [];

		if (releaseChannelIds.length > 0) {
			projectReleaseChannels = await getDb()
				.select()
				.from(releaseChannels)
				.where(inArray(releaseChannels.releaseChannelId, releaseChannelIds))
				.all();
		}

		for (const releaseChannels of projectReleaseChannels) {
			const project = projs.find(p => p.projectId === releaseChannels.projectId);
			if (project !== undefined) {
				project.defaultReleaseChannel = releaseChannels;
			}
		}

		return list;
	}

	getProject(projectName: string, userId: number): Promise<Project> {
		return getDb().select().from(projects)
			.where(and(
				eq(projects.name, projectName),
				eq(projects.userId, userId),
			))
			.get();
	}

	getProjectByName(projectName: string): Promise<Project> {
		return getDb().select().from(projects)
			.where(eq(projects.name, projectName))
			.get();
	}

	getProjectByNameAndUser(projectName: string, userId: number): Promise<Project> {
		return getDb().select().from(projects)
			.where(and(
				eq(projects.name, projectName),
				eq(projects.userId, userId),
			))
			.get();
	}

	getProjectById(projectId: number): Promise<Project> {
		return getDb()
			.select()
			.from(projects)
			.where(eq(projects.projectId, projectId))
			.get();
	}

	// Insert a new project
	// Be sure to also make release channels for the project
	insertNewProject(project: InsertProject): Promise<Project> {
		return getDb().insert(projects)
			.values(project)
			.returning()
			.get();
	}

	updateProject(projectId: number, project: Partial<InsertProject>): Promise<Project> {
		return getDb()
			.update(projects)
			.set(project)
			.where(eq(projects.projectId, projectId))
			.returning()
			.get();
	}
}

const ProjectStore = new _ProjectStore();
export default ProjectStore;
