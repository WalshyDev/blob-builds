import { and, eq, gt } from 'drizzle-orm';
import { OAuthState, oauthState } from '~/store/schema';
import Constants from '~/utils/constants';
import { randomHex } from '~/utils/crypto';
import { getDb } from '~/utils/storage';

class _OAuthStateStore {

	async createState(): Promise<string> {
		const state = randomHex(32);
		const now = Date.now();
		const expires = now + Constants.STATE_DURATION;

		await getDb().insert(oauthState).values({
			state,
			createdAt: now,
			expiresAt: expires,
		}).execute();

		return state;
	}

	async getByState(state: string): Promise<OAuthState | undefined> {
		// TODO: Clean up old states
		return getDb()
			.select()
			.from(oauthState)
			.where(and(
				eq(oauthState.state, state),
				gt(oauthState.expiresAt, Date.now()),
			))
			.get();
	}
}

const OAuthStateStore = new _OAuthStateStore();
export default OAuthStateStore;
