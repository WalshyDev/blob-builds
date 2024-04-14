import { and, eq, gt } from 'drizzle-orm';
import { sessions } from '~/store/schema';
import Constants from '~/utils/constants';
import { randomHex } from '~/utils/crypto';
import { getDb } from '~/utils/storage';

class _SessionStore {

	async createSession(userId: number): Promise<string> {
		const sessionId = 'bb_' + randomHex(64);

		const now = Date.now();
		const expires = now + Constants.SESSION_DURATION;

		await getDb().insert(sessions).values({
			sessionId,
			userId,
			createdAt: now,
			expiresAt: expires,
		}).execute();

		return sessionId;
	}

	async getUserIdBySessionId(sessionId: string): Promise<{ userId: number } | undefined> {
		return getDb()
			.select({ userId: sessions.userId })
			.from(sessions)
			.where(and(
				eq(sessions.sessionId, sessionId),
				gt(sessions.expiresAt, Date.now()),
			))
			.get();
	}
}

const SessionStore = new _SessionStore();
export default SessionStore;
