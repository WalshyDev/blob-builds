import { eq } from 'drizzle-orm';
import { ProjectSettings, projectSettings } from '~/store/schema';
import { getDb } from '~/utils/storage';

class _ProjectSettingStore {

	getSettings(projectId: number): Promise<ProjectSettings> {
		return getDb().select().from(projectSettings).where(eq(projectSettings.projectId, projectId)).get();
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
		return getDb().insert(projectSettings).values({ projectId }).run();
	}
}

const ProjectSettingStore = new _ProjectSettingStore();
export default ProjectSettingStore;
