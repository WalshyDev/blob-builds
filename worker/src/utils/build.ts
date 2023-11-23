export function getFilePath(projectName: string, releaseChannel: string, fileHash: string) {
	return `${projectName.toLowerCase()}/${releaseChannel.toLowerCase()}/${fileHash}`;
}
