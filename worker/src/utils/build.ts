export function getFilePath(projectName: string, releaseChannel: string, fileHash: string) {
	return `${projectName.toLowerCase()}/${releaseChannel.toLowerCase()}/${fileHash}`;
}

export function getFileName(project: Project, releaseChannel: ReleaseChannel, build: Build) {
	return releaseChannel.file_naming
		.replace('$project', project.name)
		.replace('$releaseChannel', releaseChannel.name)
		.replace('$buildId', String(build.build_id));
}

// TODO: Move all existing files off the case sensitive file path and all to lowercase
export function getLegacyFilePath(projectName: string, releaseChannel: string, fileHash: string) {
	return `${projectName}/${releaseChannel}/${fileHash}`;
}

export function getBuildId(version: string): number | null {
	let buildId: number;
	try {
		buildId = parseInt(version);

		if (Number.isNaN(buildId) || buildId < 1) {
			return null;
		}

		return buildId;
	} catch(_) {
		return null;
	}
}
