import { queryRow } from '~/store/_db';

export async function getUserByApiToken(DB: D1Database, apiToken: string): Promise<User | null> {
	const res = await queryRow<User>(
		DB,
		'SELECT * FROM users WHERE api_token = ?',
		apiToken,
	);

	if (res.success === true) {
		return res.data;
	} else {
		console.error(`getUser: Failed to get user! Error: ${res.internalError}`);
		return null;
	}
}
