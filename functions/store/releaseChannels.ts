import { queryRow } from '~/functions/store/_db';

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
