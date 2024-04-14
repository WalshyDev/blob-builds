import { eq, and } from 'drizzle-orm';
import { InsertUser, User, users } from '~/store/schema';
import { randomChars } from '~/utils/crypto';
import { getDb } from '~/utils/storage';

class _UserStore {

	insertNewUser(user: InsertUser): Promise<User> {
		return getDb().insert(users)
			.values(user)
			.returning()
			.get();
	}

	createNewUserFromOAuth(provider: OAuthProvider, userId: number, username: string): Promise<User> {
		const apiToken = randomChars(64);

		return getDb().insert(users)
			.values({
				name: username,
				oauthProvider: provider,
				oauthId: String(userId),
				apiToken,
			})
			.returning()
			.get();
	}

	// Get user by API token
	getUserByApiToken(apiToken: string): Promise<User | undefined> {
		return getDb().select()
			.from(users)
			.where(eq(users.apiToken, apiToken))
			.get();
	}

	getUserById(userId: number): Promise<User | undefined> {
		return getDb().select()
			.from(users)
			.where(eq(users.userId, userId))
			.get();
	}

	getUserByOAuthId(provider: OAuthProvider, userId: number): Promise<User | undefined> {
		return getDb().select()
			.from(users)
			.where(and(
				eq(users.oauthProvider, provider),
				eq(users.oauthId, String(userId)),
			))
			.get();
	}
}

const UserStore = new _UserStore();
export default UserStore;
