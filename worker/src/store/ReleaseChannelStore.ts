import { eq, and } from 'drizzle-orm';
import { InsertReleaseChannel, ReleaseChannel, releaseChannels } from '~/store/schema';
import { getDb } from '~/utils/storage';

class _ReleaseChannelStore {

	// Get release channel
	getReleaseChannel(releaseChannelName: string, projectId: number): Promise<ReleaseChannel | undefined> {
		return getDb().select()
			.from(releaseChannels)
			.where(and(
				eq(releaseChannels.name, releaseChannelName),
				eq(releaseChannels.projectId, projectId),
			))
			.get();
	}

	getReleaseChannelById(releaseChannelId: number): Promise<ReleaseChannel | undefined> {
		return getDb()
			.select()
			.from(releaseChannels)
			.where(eq(releaseChannels.releaseChannelId, releaseChannelId))
			.get();
	}

	getReleaseChannelsForProject(projectId: number): Promise<ReleaseChannel[] | undefined> {
		return getDb()
			.select()
			.from(releaseChannels)
			.where(eq(releaseChannels.projectId, projectId))
			.all();
	}

	// Insert a new release channel
	insertNewReleaseChannel(releaseChannel: InsertReleaseChannel | InsertReleaseChannel[]): Promise<ReleaseChannel[]> {
		return getDb()
			.insert(releaseChannels)
			.values(Array.isArray(releaseChannel) ? releaseChannel : [releaseChannel])
			.returning()
			.all();
	}

	updateReleaseChannel(
		releaseChannelId: number,
		releaseChannel: Partial<InsertReleaseChannel>,
	): Promise<ReleaseChannel> {
		return getDb()
			.update(releaseChannels)
			.set(releaseChannel)
			.where(eq(releaseChannels.releaseChannelId, releaseChannelId))
			.returning()
			.get();
	}
}

const ReleaseChannelStore = new _ReleaseChannelStore();
export default ReleaseChannelStore;
