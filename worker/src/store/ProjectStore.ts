import { and, eq, sql } from 'drizzle-orm';
import { projects, users } from '~/store/schema';
import { getDb } from '~/utils/storage';
import type { InsertProject, Project } from '~/store/schema';

export type ProjectList = SingleProjectList[];
type SingleProjectList = {
	name: string;
	owner: string;
	releaseChannels: string[];
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
}

const ProjectStore = new _ProjectStore();
export default ProjectStore;
