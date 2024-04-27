export function buildProjectList(projects: ProjectResponse[]): ProjectList {
	const projectList: ProjectList = {};
	
	for (const proj of projects) {
		const existing = projectList[proj.owner!];
		if (existing  !== undefined) {
			existing.push(proj);
		} else {
			projectList[proj.owner!] = [proj];
		}
	}

	return projectList;
}
