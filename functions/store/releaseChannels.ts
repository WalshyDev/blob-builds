import { batch, queryRow } from '~/functions/store/_db';

export async function getReleaseChannel(
	DB: D1Database,
	releaseChannelName: string,
	projectId: number,
): Promise<ReleaseChannel | null> {
	const res = await queryRow<ReleaseChannel>(
		DB,
		'SELECT * FROM release_channels WHERE name = ? AND project_id = ?',
		releaseChannelName, projectId,
	);

	if (res.success) {
		return res.data;
	} else {
		console.error(`getReleaseChannel: Failed to get release channel! Error: ${res.internalError}`);
		return null;
	}
}

export async function createReleaseChannels(DB: D1Database, channels: Omit<ReleaseChannel, 'release_channel_id'>[]) {
	const res = await batch(
		DB,
		`INSERT INTO release_channels (project_id, name, supported_versions, dependencies, file_naming)
		VALUES (?, ?, ?, ?, ?)`,
		...channels.map(channel => [
			channel.project_id,
			channel.name,
			channel.supported_versions,
			JSON.stringify(channel.dependencies),
			channel.file_naming,
		]),
	);

	if (res.success) {
		return res.data;
	} else {
		console.error(`createReleaseChannels: Failed to create release channels! Error: ${res.internalError}`);
		return null;
	}
}
