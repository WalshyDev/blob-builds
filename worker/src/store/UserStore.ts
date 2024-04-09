import { eq } from 'drizzle-orm';
import { InsertUser, User, users } from '~/store/schema';
import { getDb } from '~/utils/storage';

class _UserStore {

	insertNewUser(user: InsertUser): Promise<User> {
		return getDb().insert(users)
			.values(user)
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
}

const UserStore = new _UserStore();
export default UserStore;
