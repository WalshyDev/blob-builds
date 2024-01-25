import { eq } from 'drizzle-orm';
import { ProjectSettings, projectSettings } from '~/store/schema';
import { getDb } from '~/utils/storage';

class _ProjectSettingStore {

	async getSettings(projectId: number, createIfNotExists = true): Promise<ProjectSettings | undefined> {
		let settings = await getDb()
			.select()
			.from(projectSettings)
			.where(eq(projectSettings.projectId, projectId))
			.get();

		if (settings === undefined && createIfNotExists) {
			settings = await this.newProject(projectId);
		}

		return settings;
	}

	updateSettings(projectId: number, settings: Partial<ProjectSettings>): Promise<ProjectSettings> {
		return getDb()
			.update(projectSettings)
			.set(settings)
			.where(eq(projectSettings.projectId, projectId))
			.returning()
			.get();
	}

	newProject(projectId: number) {
		return getDb().insert(projectSettings).values({ projectId }).returning().get();
	}
}

const ProjectSettingStore = new _ProjectSettingStore();
export default ProjectSettingStore;
