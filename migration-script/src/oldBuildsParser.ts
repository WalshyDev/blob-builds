const BUILDS_GITHUB = 'https://raw.githubusercontent.com/TheBusyBiscuit/builds/gh-pages';

export async function parseParth(oldPath: string): Promise<{ owner: string, repo: string, branch: string }> {
	const [owner, repo, branch] = oldPath.split('/');
	return { owner, repo, branch };
}

export async function loadBuilds(oldPath: string): Promise<OldBuild[]> {
	const buildsJsonRes = await fetch(`${BUILDS_GITHUB}/${oldPath}/builds.json`);
	const json = await buildsJsonRes.json() as BuildsJson;

	const builds: OldBuild[] = [];
	for (const buildId in json) {
		const build = json[buildId];
		if (typeof build !== 'object') continue; // "last_successful" and "latest"

		builds.push({
			id: build.id,
			commitSha: build.sha,
			changelog: build.message,
			timestamp: build.timestamp,
			status: build.status,
		});
	}

	return builds;
}

export async function downloadJarFromOld(oldPath: string, build: OldBuild): Promise<ArrayBuffer | null> {
	const { repo } = await parseParth(oldPath);

	console.log(`Downloading ${BUILDS_GITHUB}/${oldPath}/${repo}-${build.id}.jar...`);
	const jarRes = await fetch(`${BUILDS_GITHUB}/${oldPath}/${repo}-${build.id}.jar`);
	if (!jarRes.ok) {
		if (jarRes.status === 404) {
			console.warn(`Skipping build ${build.id} because it does not exist`);
			return null;
		}
		throw new Error(`Failed to download jar: ${jarRes.statusText}`);
	}

	return jarRes.arrayBuffer();
}
