import { queryRow, queryRows } from 'functions/store/_db';

export async function getProject(DB: D1Database, projectName: string, userId: number): Promise<Project | null> {
	const res = await queryRow<Project>(DB,
		'SELECT * FROM projects WHERE name = ? AND user_id = ?',
		projectName, userId,
	);

	if (res.success) {
		return res.data;
	} else {
		console.error(`getProject: Failed to get project! Error: ${res.internalError}`);
		return null;
	}
}

export async function getProjectByName(DB: D1Database, projectName: string): Promise<Project | null> {
	const res = await queryRow<Project>(DB,
		'SELECT * FROM projects WHERE name = ?',
		projectName,
	);

	if (res.success) {
		return res.data;
	} else {
		console.error(`getProjectByName: Failed to get project! Error: ${res.internalError}`);
		return null;
	}
}

export async function getProjects(DB: D1Database): Promise<Project[] | null> {
	const res = await queryRows<Project>(DB, 'SELECT * FROM projects');

	if (res.success) {
		return res.data;
	} else {
		console.error(`getProjects: Failed to get projects! Error: ${res.internalError}`);
		return null;
	}
}

export type ProjectList = SingleProjectList[];
type SingleProjectList = {
	project_name: string;
	project_owner: string;
	release_channels: string[];
};

export async function getProjectListByUser(DB: D1Database): Promise<ProjectList | null> {
	const res = await queryRows<SingleProjectList>(DB, `
		SELECT
			projects.name AS project_name,
			users.name AS project_owner,
			(SELECT json_group_array(name) FROM release_channels WHERE release_channels.project_id = projects.project_id)
				AS release_channels
		FROM projects
		LEFT JOIN users ON users.user_id = projects.user_id
		GROUP BY users.user_id
	`);

	if (res.success) {
		// hacky but d1 doesn't do it auto :(
		for (const row of res.data) {
			row.release_channels = JSON.parse(row.release_channels as unknown as string);
		}
		return res.data;
	} else {
		console.error(`getProjectListByUser: Failed to get projects! Error: ${res.internalError}`);
		return null;
	}
}
